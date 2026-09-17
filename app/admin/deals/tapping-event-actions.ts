"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventStatus =
  | "contacted"
  | "meeting"
  | "reviewing"
  | "interested"
  | "committed"
  | "passed"
  | "hold";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인 필요" };
  return { ok: true as const, supabase };
}

/** 새 태핑 이벤트 추가. sequence 는 기존 최대값 + 1 */
export async function createTappingEvent(
  tappingId: string,
  input: {
    operator: string;
    status?: EventStatus;
    contact_date?: string | null;
    notes?: string | null;
  },
): Promise<{ error?: string; id?: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };
  const operator = input.operator?.trim();
  if (!operator) return { error: "태핑 대상 이름을 입력해주세요." };

  const { data: last } = await auth.supabase
    .from("tapping_events")
    .select("sequence")
    .eq("tapping_id", tappingId)
    .order("sequence", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextSeq = ((last?.sequence as number | null) ?? 0) + 1;

  const { data, error } = await auth.supabase
    .from("tapping_events")
    .insert({
      tapping_id: tappingId,
      sequence: nextSeq,
      operator,
      status: input.status ?? "contacted",
      contact_date: input.contact_date || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/deals");
  return { id: data.id as string };
}

export async function updateTappingEvent(
  id: string,
  patch: {
    operator?: string;
    status?: EventStatus;
    contact_date?: string | null;
    notes?: string | null;
  },
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const clean: Record<string, unknown> = {};
  if (patch.operator !== undefined) {
    const v = patch.operator.trim();
    if (!v) return { error: "태핑 대상 이름은 비울 수 없습니다." };
    clean.operator = v;
  }
  if (patch.status !== undefined) clean.status = patch.status;
  if (patch.contact_date !== undefined) clean.contact_date = patch.contact_date || null;
  if (patch.notes !== undefined) clean.notes = patch.notes?.trim() || null;

  if (Object.keys(clean).length === 0) return { success: true };

  const { error } = await auth.supabase
    .from("tapping_events")
    .update(clean)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/deals");
  return { success: true };
}

/**
 * 칸반 드래그 시 사용:
 * - 태핑에 이벤트가 있으면 → 최신 이벤트의 status 변경
 * - 이벤트가 없으면 → operator 인자로 새 이벤트 생성 (필수)
 */
export async function moveTappingStatus(
  tappingId: string,
  newStatus: EventStatus,
  fallbackOperator?: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const { data: latest } = await auth.supabase
    .from("tapping_events")
    .select("id, sequence")
    .eq("tapping_id", tappingId)
    .order("sequence", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (latest?.id) {
    const { error } = await auth.supabase
      .from("tapping_events")
      .update({ status: newStatus })
      .eq("id", latest.id);
    if (error) return { error: error.message };
  } else {
    if (!fallbackOperator?.trim()) {
      return { error: "이벤트가 없습니다. 태핑 대상을 먼저 입력해주세요." };
    }
    const { error } = await auth.supabase
      .from("tapping_events")
      .insert({
        tapping_id: tappingId,
        sequence: 1,
        operator: fallbackOperator.trim(),
        status: newStatus,
        contact_date: new Date().toISOString().slice(0, 10),
      });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/deals");
  return { success: true };
}

export async function deleteTappingEvent(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.supabase.from("tapping_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/deals");
  return { success: true };
}
