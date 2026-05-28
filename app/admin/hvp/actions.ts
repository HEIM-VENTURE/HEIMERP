"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; success?: boolean };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "로그인 필요" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { supabase, error: "관리자 권한 필요" as const };

  return { supabase, error: null };
}

function nullIfEmpty(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseRate(raw: string): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return 0.2;
  const normalized = num > 1 ? num / 100 : num;
  if (normalized < 0 || normalized > 1) return 0.2;
  return Math.round(normalized * 1000) / 1000;
}

export async function createHvpAction(formData: FormData): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "이름을 입력하세요" };

  const { error } = await supabase.from("hvp").insert({
    name,
    organization: nullIfEmpty(formData.get("organization")),
    phone: nullIfEmpty(formData.get("phone")),
    email: nullIfEmpty(formData.get("email")),
    cohort: nullIfEmpty(formData.get("cohort")),
    status: String(formData.get("status") ?? "active"),
    default_fee_rate: parseRate(String(formData.get("default_fee_rate") ?? "20")),
    notes: nullIfEmpty(formData.get("notes")),
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/hvp");
  return { success: true };
}

export async function updateHvpAction(hvpId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "이름을 입력하세요" };

  const { error } = await supabase
    .from("hvp")
    .update({
      name,
      organization: nullIfEmpty(formData.get("organization")),
      phone: nullIfEmpty(formData.get("phone")),
      email: nullIfEmpty(formData.get("email")),
      cohort: nullIfEmpty(formData.get("cohort")),
      status: String(formData.get("status") ?? "active"),
      default_fee_rate: parseRate(String(formData.get("default_fee_rate") ?? "20")),
      notes: nullIfEmpty(formData.get("notes")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", hvpId);

  if (error) return { error: error.message };

  revalidatePath("/admin/hvp");
  return { success: true };
}

export async function deleteHvpAction(hvpId: string): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("hvp").delete().eq("id", hvpId);
  if (error) return { error: error.message };

  revalidatePath("/admin/hvp");
  return { success: true };
}
