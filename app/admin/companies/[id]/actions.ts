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

/** TIPS 운영사 매칭 + 거래 조건 변경 (operatorId null이면 매칭/조건 모두 해제).
 *  valuationEok / investmentEok 는 억 단위 입력. DB 는 백만원 단위로 저장(× 100). */
export async function updateTipsOperatorMatchAction(
  companyId: number,
  operatorId: string | null,
  valuationEok: number | null = null,
  investmentEok: number | null = null
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

  const update: {
    tips_operator_id: string | null;
    tips_match_valuation: number | null;
    tips_match_investment: number | null;
  } = {
    tips_operator_id: operatorId,
    tips_match_valuation: null,
    tips_match_investment: null,
  };

  if (operatorId) {
    update.tips_match_valuation =
      valuationEok != null && Number.isFinite(valuationEok)
        ? Math.round(valuationEok * 100)
        : null;
    update.tips_match_investment =
      investmentEok != null && Number.isFinite(investmentEok)
        ? Math.round(investmentEok * 100)
        : null;
  }

  const { error } = await supabase
    .from("companies")
    .update(update)
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
