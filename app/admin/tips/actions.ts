"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string; success?: boolean; id?: string };

async function requireAdmin(): Promise<{ error?: string; supabase?: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "관리자 권한 필요" };
  return { supabase };
}

function buildRow(formData: FormData) {
  const meetingRaw = String(formData.get("last_meeting_at") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    assigned_pm: String(formData.get("assigned_pm") ?? "").trim() || null,
    focus_area: String(formData.get("focus_area") ?? "").trim() || null,
    last_meeting_at: meetingRaw || null,
    contact_person: String(formData.get("contact_person") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createTipsOperatorAction(formData: FormData): Promise<Result> {
  const { error: authErr, supabase } = await requireAdmin();
  if (authErr || !supabase) return { error: authErr ?? "권한 없음" };

  const row = buildRow(formData);
  if (!row.name) return { error: "기관명은 필수입니다" };

  const { data, error } = await supabase
    .from("tips_operators")
    .insert(row)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/tips");
  return { success: true, id: data?.id };
}

export async function updateTipsOperatorAction(
  id: string,
  formData: FormData
): Promise<Result> {
  const { error: authErr, supabase } = await requireAdmin();
  if (authErr || !supabase) return { error: authErr ?? "권한 없음" };

  const row = buildRow(formData);
  if (!row.name) return { error: "기관명은 필수입니다" };

  const { error } = await supabase.from("tips_operators").update(row).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/tips");
  return { success: true };
}

export async function deleteTipsOperatorAction(id: string): Promise<Result> {
  const { error: authErr, supabase } = await requireAdmin();
  if (authErr || !supabase) return { error: authErr ?? "권한 없음" };

  const { error } = await supabase.from("tips_operators").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/tips");
  return { success: true };
}
