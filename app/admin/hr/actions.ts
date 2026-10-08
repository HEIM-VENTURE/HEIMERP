"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LeaveType = "annual" | "half_am" | "half_pm" | "sick" | "official" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인 필요" };
  return { ok: true as const, supabase, user };
}

/** 두 날짜 사이 일수 계산 (양 끝 포함, 반차 처리는 호출자에서) */
function daysBetweenInclusive(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
}

/** 연차 신청 */
export async function createLeaveRequest(
  input: {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason?: string;
  },
): Promise<{ error?: string; id?: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const { leave_type, start_date, end_date, reason } = input;
  if (!start_date || !end_date) return { error: "날짜를 입력해주세요." };
  if (end_date < start_date) return { error: "종료일이 시작일보다 빠릅니다." };

  // 반차는 0.5일, 아니면 inclusive day count
  const isHalf = leave_type === "half_am" || leave_type === "half_pm";
  const days = isHalf ? 0.5 : daysBetweenInclusive(start_date, end_date);

  const { data, error } = await auth.supabase
    .from("leave_requests")
    .insert({
      user_id: auth.user.id,
      leave_type,
      start_date,
      end_date: isHalf ? start_date : end_date,
      days,
      reason: reason?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/hr/leaves");
  return { id: data.id as string };
}

/** 승인·반려 (admin only) */
export async function decideLeaveRequest(
  id: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("leave_requests")
    .update({
      status: decision,
      decided_by: auth.user.id,
      decided_at: new Date().toISOString(),
      decision_note: note?.trim() || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/hr/leaves");
  return { success: true };
}

/** 신청 취소 (본인만 · 승인 전만) */
export async function cancelLeaveRequest(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const { data: row } = await auth.supabase
    .from("leave_requests")
    .select("user_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { error: "신청을 찾을 수 없습니다." };
  if (row.user_id !== auth.user.id) return { error: "본인 신청만 취소할 수 있습니다." };
  if (row.status === "approved") return { error: "이미 승인된 신청입니다. 관리자에게 요청해주세요." };

  const { error } = await auth.supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/hr/leaves");
  return { success: true };
}

/** 멤버 입사일/연간 연차수/상태 변경 (admin) */
export async function updateMemberHr(
  userId: string,
  patch: {
    hired_at?: string | null;
    annual_leave_days?: number | null;
    employment_status?: "active" | "on_leave" | "resigned";
  },
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const clean: Record<string, unknown> = {};
  if (patch.hired_at !== undefined) clean.hired_at = patch.hired_at || null;
  if (patch.annual_leave_days !== undefined) clean.annual_leave_days = patch.annual_leave_days;
  if (patch.employment_status !== undefined) clean.employment_status = patch.employment_status;

  if (Object.keys(clean).length === 0) return { success: true };

  const { error } = await auth.supabase.from("profiles").update(clean).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/hr/members");
  revalidatePath("/admin/hr/leaves");
  return { success: true };
}
