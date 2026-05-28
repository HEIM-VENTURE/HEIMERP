"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; success?: boolean; companyId?: number };

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

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pmOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s && s !== "none" ? s : null;
}

export async function createCompanyAction(formData: FormData): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "회사명을 입력하세요" };

  const hvpIdRaw = String(formData.get("hvp_id") ?? "").trim();
  const hvpId = hvpIdRaw && hvpIdRaw !== "none" ? hvpIdRaw : null;

  const gradeRaw = String(formData.get("program_grade") ?? "").trim();
  const programGrade = gradeRaw && gradeRaw !== "none" ? gradeRaw : null;

  const insert = {
    name,
    address: nullIfEmpty(formData.get("address")),
    ceo_name: nullIfEmpty(formData.get("ceo_name")),
    phone: nullIfEmpty(formData.get("phone")),
    email: nullIfEmpty(formData.get("email")),
    main_item: nullIfEmpty(formData.get("main_item")),
    founded_at: nullIfEmpty(formData.get("founded_at")),
    last_year_revenue: numOrNull(formData.get("last_year_revenue")),
    inquiry_purpose: nullIfEmpty(formData.get("inquiry_purpose")),
    proposal_amount: numOrNull(formData.get("proposal_amount")),
    program_grade: programGrade,
    hvp_id: hvpId,
    sales_stage: String(formData.get("sales_stage") ?? "received"),
    source: "manual",
    notes: nullIfEmpty(formData.get("notes")),
    custom_fields: pmOrNull(formData.get("pm")) ? { pm: pmOrNull(formData.get("pm")) } : {},
  };

  const { data, error } = await supabase
    .from("companies")
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  return { success: true, companyId: data.id };
}

export async function updateCompanyAction(
  companyId: number,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "회사명을 입력하세요" };

  const hvpIdRaw = String(formData.get("hvp_id") ?? "").trim();
  const hvpId = hvpIdRaw && hvpIdRaw !== "none" ? hvpIdRaw : null;

  const gradeRaw = String(formData.get("program_grade") ?? "").trim();
  const programGrade = gradeRaw && gradeRaw !== "none" ? gradeRaw : null;

  // 기존 custom_fields 유지하며 pm만 갱신
  const { data: existing } = await supabase
    .from("companies")
    .select("custom_fields")
    .eq("id", companyId)
    .single();
  const customFields = { ...(existing?.custom_fields ?? {}) };
  const pm = pmOrNull(formData.get("pm"));
  if (pm) customFields.pm = pm;
  else delete customFields.pm;

  const update = {
    name,
    address: nullIfEmpty(formData.get("address")),
    ceo_name: nullIfEmpty(formData.get("ceo_name")),
    phone: nullIfEmpty(formData.get("phone")),
    email: nullIfEmpty(formData.get("email")),
    main_item: nullIfEmpty(formData.get("main_item")),
    founded_at: nullIfEmpty(formData.get("founded_at")),
    last_year_revenue: numOrNull(formData.get("last_year_revenue")),
    inquiry_purpose: nullIfEmpty(formData.get("inquiry_purpose")),
    proposal_amount: numOrNull(formData.get("proposal_amount")),
    program_grade: programGrade,
    hvp_id: hvpId,
    notes: nullIfEmpty(formData.get("notes")),
    custom_fields: customFields,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("companies").update(update).eq("id", companyId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  return { success: true, companyId };
}
