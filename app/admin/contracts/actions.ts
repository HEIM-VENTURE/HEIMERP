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

export async function createContractAction(formData: FormData): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const companyId = Number(formData.get("company_id"));
  if (!companyId) return { error: "기업이 선택되지 않았습니다" };

  const contractedAt = String(formData.get("contracted_at") ?? "").trim();
  if (!contractedAt) return { error: "계약일을 입력하세요" };

  const totalAmount = Number(formData.get("total_amount"));
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    return { error: "총 금액이 유효하지 않습니다" };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("contracts").insert({
    company_id: companyId,
    contracted_at: contractedAt,
    total_amount: totalAmount,
    notes,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/contracts");
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function updateContractAction(contractId: number, formData: FormData): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const contractedAt = String(formData.get("contracted_at") ?? "").trim();
  if (!contractedAt) return { error: "계약일을 입력하세요" };

  const totalAmount = Number(formData.get("total_amount"));
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    return { error: "총 금액이 유효하지 않습니다" };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("contracts")
    .update({
      contracted_at: contractedAt,
      total_amount: totalAmount,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .select("company_id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/contracts");
  if (data?.company_id) revalidatePath(`/admin/companies/${data.company_id}`);
  return { success: true };
}

export async function deleteContractAction(contractId: number): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { data: row } = await supabase
    .from("contracts")
    .select("company_id")
    .eq("id", contractId)
    .single();

  const { error } = await supabase.from("contracts").delete().eq("id", contractId);
  if (error) return { error: error.message };

  revalidatePath("/admin/contracts");
  if (row?.company_id) revalidatePath(`/admin/companies/${row.company_id}`);
  return { success: true };
}
