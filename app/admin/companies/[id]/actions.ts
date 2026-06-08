"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function changeSalesStageAction(companyId: number, newStage: string) {
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
  if (profile?.role !== "admin" && profile?.role !== "hvp") {
    return { error: "권한 없음" };
  }

  const { error } = await supabase
    .from("companies")
    .update({ sales_stage: newStage })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/todos");
  return { success: true };
}

export async function changeConsultingStageAction(companyId: number, newStage: string | null) {
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
  if (profile?.role !== "admin") {
    return { error: "관리자 권한 필요" };
  }

  const { error } = await supabase
    .from("companies")
    .update({ consulting_stage: newStage })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/todos");
  return { success: true };
}

export async function dropCompanyAction(companyId: number, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { error } = await supabase
    .from("companies")
    .update({ drop_reason: reason || "중단" })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

/** TIPS 운영사 매칭 변경 (null이면 매칭 해제) */
export async function updateTipsOperatorMatchAction(
  companyId: number,
  operatorId: string | null
) {
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
  if (profile?.role !== "admin") {
    return { error: "관리자 권한 필요" };
  }

  const { error } = await supabase
    .from("companies")
    .update({ tips_operator_id: operatorId })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/tips");
  return { success: true };
}

/** 드랍 취소(복구) — drop_reason 제거 */
export async function restoreCompanyAction(companyId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { error } = await supabase
    .from("companies")
    .update({ drop_reason: null })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
