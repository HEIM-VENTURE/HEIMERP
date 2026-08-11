"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Decision = "go" | "more_docs" | "no_go";
type AdminRank = "owner" | "member";

// ─────────────────────────────────────────────
// 공통: 로그인·권한 판정 헬퍼
// ─────────────────────────────────────────────
async function requireAdmin(): Promise<
  | { ok: true; me: { id: string; name: string; rank: AdminRank } }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, error: "로그인 세션이 만료되었습니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "관리자 권한이 필요합니다." };
  }
  return {
    ok: true,
    me: {
      id: profile.id as string,
      name: (profile.name as string) ?? "",
      rank: "member" as AdminRank,
    },
  };
}

// rank 잠금 없음 — admin이면 모든 신청 편집 가능
async function canEdit(
  _applicationId: string,
  _me: { id: string; rank: AdminRank }
): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: true };
}

/**
 * 접수 판정 저장.
 */
export async function saveDecisionAction(
  applicationId: string,
  decision: Decision,
  notes: string
): Promise<{ ok: true; alreadySent: boolean } | { ok: false; error: string }> {
  if (!applicationId) return { ok: false, error: "applicationId가 없습니다." };
  if (!["go", "more_docs", "no_go"].includes(decision)) {
    return { ok: false, error: "잘못된 판정 값입니다." };
  }

  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const { me } = auth;

  const perm = await canEdit(applicationId, me);
  if (!perm.ok) return perm;

  const admin = createAdminClient();

  // 현재 상태 조회 — 중복 발송 방지 판단용
  const { data: current } = await admin
    .from("applications")
    .select("status, email_sent_at")
    .eq("id", applicationId)
    .maybeSingle();
  const prevStatus = (current?.status as Decision | null) ?? null;
  const prevSentAt = (current?.email_sent_at as string | null) ?? null;

  // 같은 판정으로 이미 이메일 발송된 적 있으면 재발송 안 함
  //   (사장님이 검토의견만 수정하려고 저장 다시 누르는 경우도 이메일은 안 감)
  const sameDecisionAlreadySent =
    prevStatus === decision && !!prevSentAt && decision !== "no_go";

  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: decision,
    review_notes: notes.trim() || null,
    reviewer_id: me.id,
    reviewer_name: me.name,
    decided_at: nowIso,
  };

  if (decision === "no_go") {
    payload.archived_at = nowIso;
    payload.email_pending = false;
  } else if (sameDecisionAlreadySent) {
    // 같은 판정 재저장: email 관련 필드 그대로 유지 (재발송 안 함)
    payload.archived_at = null;
  } else {
    // 판정 변경 or 첫 판정: 이메일 큐 재활성화
    payload.archived_at = null;
    payload.email_pending = true;
    payload.email_sent_at = null;
    payload.email_error = null;
  }

  const { error: updateErr } = await admin
    .from("applications")
    .update(payload)
    .eq("id", applicationId);

  if (updateErr) {
    console.error("[decision] 저장 실패", updateErr);
    return { ok: false, error: `저장 실패: ${updateErr.message}` };
  }

  // 이메일 발송: GO / more_docs이고, 중복 발송 아닐 때만
  if ((decision === "go" || decision === "more_docs") && !sameDecisionAlreadySent) {
    await triggerEmail(applicationId, decision as EmailKind, notes, admin);
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin/dashboard");
  return { ok: true, alreadySent: sameDecisionAlreadySent };
}

type EmailKind = "go" | "more_docs" | "meeting_info" | "custom";

/**
 * Apps Script webhook 호출 → Gmail 발송.
 * kind에 따라 다른 이메일 템플릿 사용. custom은 subject/body 추가 payload 필요.
 * 판정 저장 흐름(go/more_docs)에서 호출되면 email_sent_at 업데이트, 부가 발송(meeting_info/custom)에서는 email_sent_at 안 건드림.
 */
async function triggerEmail(
  applicationId: string,
  decision: EmailKind,
  notes: string,
  admin: ReturnType<typeof createAdminClient>,
  extra?: { subject?: string; body?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL;
  const secret = process.env.APPS_SCRIPT_SHARED_SECRET;

  if (!webhookUrl || !secret) {
    console.warn("[email] APPS_SCRIPT_WEBHOOK_URL 또는 APPS_SCRIPT_SHARED_SECRET 미설정. 이메일 발송 건너뜀.");
    await admin
      .from("applications")
      .update({ email_error: "Apps Script webhook 미설정" })
      .eq("id", applicationId);
    return { ok: false, error: "Apps Script webhook 미설정" };
  }

  // 이메일 발송에 필요한 필드 재조회
  const { data: app } = await admin
    .from("applications")
    .select("application_no, company_name, contact_name, email")
    .eq("id", applicationId)
    .maybeSingle();

  if (!app) {
    console.error("[email] 신청서를 다시 조회할 수 없음");
    return { ok: false, error: "신청서를 다시 조회할 수 없음" };
  }

  const payload: Record<string, unknown> = {
    secret,
    application_no: app.application_no as string,
    decision,
    company_name: app.company_name as string,
    to_name: (app.contact_name as string) || "담당자",
    to_email: app.email as string,
    notes: notes.trim(),
  };
  if (decision === "custom") {
    payload.subject = extra?.subject ?? "";
    payload.body = extra?.body ?? "";
  }

  // email_sent_at은 판정 이메일(go/more_docs) 발송 성공 시에만 업데이트.
  // 부가 발송(meeting_info/custom)은 원 판정의 email_sent_at을 건드리지 않음.
  const isDecisionEmail = decision === "go" || decision === "more_docs";

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Apps Script Web App은 302 리다이렉트로 응답할 수 있음
      redirect: "follow",
    });
    const text = await resp.text();
    let json: { ok?: boolean; error?: string; sent_at?: string } = {};
    try { json = JSON.parse(text); } catch { /* not json */ }

    if (json.ok) {
      if (isDecisionEmail) {
        await admin
          .from("applications")
          .update({
            email_pending: false,
            email_sent_at: json.sent_at || new Date().toISOString(),
            email_error: null,
          })
          .eq("id", applicationId);
      } else {
        // 부가 발송 성공 시 email_error만 클리어
        await admin
          .from("applications")
          .update({ email_error: null })
          .eq("id", applicationId);
      }
      return { ok: true };
    }
    const errMsg = json.error || text.substring(0, 200);
    await admin
      .from("applications")
      .update({ email_error: `발송 실패: ${errMsg}` })
      .eq("id", applicationId);
    return { ok: false, error: errMsg };
  } catch (err) {
    console.error("[email] webhook 호출 실패", err);
    const msg = String(err).substring(0, 200);
    await admin
      .from("applications")
      .update({ email_error: `webhook 호출 실패: ${msg}` })
      .eq("id", applicationId);
    return { ok: false, error: msg };
  }
}

/**
 * 담당자 배정.
 * - member는 (미배정 상태의 신청을 본인에게 배정) 또는 (본인 담당을 미배정으로 되돌리기)만 가능.
 * - owner는 자유롭게 다른 사람에게도 배정 가능.
 */
export async function assignReviewerAction(
  applicationId: string,
  reviewerId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const admin = createAdminClient();

  // 미배정 처리
  if (!reviewerId) {
    const { error } = await admin
      .from("applications")
      .update({ reviewer_id: null, reviewer_name: null })
      .eq("id", applicationId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/applications");
    revalidatePath(`/admin/applications/${applicationId}`);
    return { ok: true };
  }

  // 배정할 사람 확인
  const { data: target, error: targetErr } = await admin
    .from("profiles")
    .select("id, name, role")
    .eq("id", reviewerId)
    .maybeSingle();
  if (targetErr || !target) return { ok: false, error: "선택한 사용자를 찾을 수 없습니다." };
  if (target.role !== "admin") return { ok: false, error: "관리자만 담당자로 배정할 수 있습니다." };

  const { error: updateErr } = await admin
    .from("applications")
    .update({ reviewer_id: target.id, reviewer_name: target.name })
    .eq("id", applicationId);
  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true };
}

/**
 * NO-GO 되돌리기 (아카이브 해제). admin이면 누구나 가능.
 */
export async function unarchiveAction(
  applicationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from("applications")
    .update({ archived_at: null, status: "new", decided_at: null })
    .eq("id", applicationId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true };
}

/**
 * 미팅 안내 이메일 발송 (고정 템플릿). GO 판정된 신청에만 노출되지만 서버에서도 status 체크.
 */
export async function sendMeetingInfoAction(
  applicationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const admin = createAdminClient();
  const { data: app } = await admin
    .from("applications")
    .select("status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return { ok: false, error: "신청을 찾을 수 없습니다." };
  if (app.status !== "go") {
    return { ok: false, error: "GO 판정된 신청에만 미팅 안내 이메일을 보낼 수 있습니다." };
  }

  const result = await triggerEmail(applicationId, "meeting_info", "", admin);
  if (!result.ok) return result;
  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true };
}

/**
 * 자유 이메일 발송. 관리자가 직접 입력한 제목·본문. 인사말·서명은 Apps Script에서 자동 감쌈.
 */
export async function sendCustomEmailAction(
  applicationId: string,
  subject: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (!subject.trim()) return { ok: false, error: "제목을 입력해주세요." };
  if (!body.trim()) return { ok: false, error: "본문을 입력해주세요." };

  const admin = createAdminClient();
  const result = await triggerEmail(
    applicationId,
    "custom",
    "",
    admin,
    { subject: subject.trim(), body: body.trim() }
  );
  if (!result.ok) return result;
  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true };
}
