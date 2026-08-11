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
    .select("id, name, role, admin_rank")
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
      rank: ((profile.admin_rank as AdminRank) ?? "member"),
    },
  };
}

// member는 (본인 담당) 또는 (미배정)일 때만 편집 가능. owner는 항상 가능.
async function canEdit(
  applicationId: string,
  me: { id: string; rank: AdminRank }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (me.rank === "owner") return { ok: true };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("applications")
    .select("reviewer_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "신청을 찾을 수 없습니다." };
  const reviewerId = data.reviewer_id as string | null;
  if (reviewerId === null || reviewerId === me.id) return { ok: true };
  return {
    ok: false,
    error: "다른 담당자의 신청은 편집할 수 없습니다. 대표에게 요청하거나 담당자 본인이 처리해주세요.",
  };
}

/**
 * 접수 판정 저장.
 */
export async function saveDecisionAction(
  applicationId: string,
  decision: Decision,
  notes: string
): Promise<{ ok: true } | { ok: false; error: string }> {
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
  } else {
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

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin/dashboard");
  return { ok: true };
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
  const { me } = auth;

  const admin = createAdminClient();

  // 현재 담당자 조회 (권한 체크용)
  const { data: current } = await admin
    .from("applications")
    .select("reviewer_id")
    .eq("id", applicationId)
    .maybeSingle();
  const currentReviewerId = (current?.reviewer_id as string | null) ?? null;

  // member의 배정 규칙
  if (me.rank !== "owner") {
    const okAsClaim = currentReviewerId === null && reviewerId === me.id;      // 미배정 → 본인
    const okAsRelease = currentReviewerId === me.id && reviewerId === null;     // 본인 → 미배정
    if (!okAsClaim && !okAsRelease) {
      return {
        ok: false,
        error: "본인 담당으로 가져오거나 미배정으로 되돌리는 것만 가능합니다. 다른 사람에게 배정하려면 대표에게 요청하세요.",
      };
    }
  }

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
 * NO-GO 되돌리기 (아카이브 해제). owner 전용.
 */
export async function unarchiveAction(
  applicationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (auth.me.rank !== "owner") {
    return { ok: false, error: "NO-GO 되돌리기는 대표만 가능합니다." };
  }

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
