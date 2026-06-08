"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitCompanyAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인 필요");

  const { data: profile } = await supabase
    .from("profiles")
    .select("hvp_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.hvp_id && profile?.role !== "admin") {
    throw new Error("HVP만 접수 가능합니다");
  }

  // 필수
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("회사명이 비어있습니다");

  const insert: any = {
    name,
    address: nullIfEmpty(formData.get("address")),
    ceo_name: nullIfEmpty(formData.get("ceo_name")),
    phone: nullIfEmpty(formData.get("phone")),
    email: nullIfEmpty(formData.get("email")),
    main_item: nullIfEmpty(formData.get("main_item")),
    founded_at: nullIfEmpty(formData.get("founded_at")),
    // 입력은 억 단위, DB는 백만원 단위로 저장
    last_year_revenue: eokToMan(formData.get("last_year_revenue_eok") ?? formData.get("last_year_revenue")),
    inquiry_purpose: nullIfEmpty(formData.get("inquiry_purpose")),
    sales_stage: "received",
    source: "hvp_self",
    hvp_id: profile.hvp_id,
    notes: nullIfEmpty(formData.get("notes")),
  };

  const { data: company, error } = await supabase
    .from("companies")
    .insert(insert)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/hvp/companies");
  revalidatePath("/hvp/dashboard");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");

  redirect(`/hvp/companies/${company.id}?welcome=1`);
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

/** 입력은 억(소수 가능), DB는 백만원 단위. × 100 후 반올림. */
function eokToMan(v: FormDataEntryValue | null): number | null {
  const eok = numOrNull(v);
  if (eok == null) return null;
  return Math.round(eok * 100);
}
