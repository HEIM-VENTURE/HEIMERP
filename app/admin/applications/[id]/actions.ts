"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Decision = "go" | "more_docs" | "no_go";

/**
 * 접수 판정 저장.
 *
 * - GO / more_docs → status·decided_at·review_notes 저장, email_pending=true (Apps Script가 발송)
 * - NO-GO → status='no_go' + archived_at 세팅 (목록에서 숨김, DB에 이력 보존, 이메일 없음)
 * - reviewer_id/name은 현재 로그인 admin에서 자동 추출
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

  // 로그인 admin 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { ok: false, error: "로그인 세션이 만료되었습니다. 다시 로그인 해주세요." };
  }

  // 프로필에서 이름 확보 (스냅샷)
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "관리자 권한이 필요합니다." };
  }

  // service_role로 업데이트 (RLS admin 정책도 통과하지만 애플리케이션 레벨에서 이미 검증했으니 안전)
  const admin = createAdminClient();

  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: decision,
    review_notes: notes.trim() || null,
    reviewer_id: user.id,
    reviewer_name: profile.name,
    decided_at: nowIso,
  };

  if (decision === "no_go") {
    payload.archived_at = nowIso;
    payload.email_pending = false;
  } else {
    // GO / more_docs → 이메일 큐 활성화 (Apps Script가 다음 세션에 픽업)
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

  // 캐시 무효화
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin/dashboard");

  return { ok: true };
}

/**
 * NO-GO 되돌리기 (아카이브 해제). 필요 시 사용.
 */
export async function unarchiveAction(
  applicationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인 필요" };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, error: "관리자만 가능" };

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
