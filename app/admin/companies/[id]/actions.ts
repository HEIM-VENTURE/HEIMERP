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

/** 새 TIPS 매칭 추가 (한 기업이 같은 운영사에 두 번 매칭 불가 — UNIQUE 제약). */
export async function addTipsMatchAction(
  companyId: number,
  operatorId: string,
  valuationEok: number | null = null,
  investmentEok: number | null = null
): Promise<{ error?: string; id?: number }> {
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

  if (!operatorId) return { error: "운영사를 선택하세요" };

  const valuation =
    valuationEok != null && Number.isFinite(valuationEok)
      ? Math.round(valuationEok * 100)
      : null;
  const investment =
    investmentEok != null && Number.isFinite(investmentEok)
      ? Math.round(investmentEok * 100)
      : null;

  const { data, error } = await supabase
    .from("company_tips_matches")
    .insert({ company_id: companyId, tips_operator_id: operatorId, valuation, investment })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "이미 매칭된 운영사입니다" };
    return { error: error.message };
  }

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/tips");
  return { id: data.id as number };
}

/** 기존 매칭의 밸류·투자금액 갱신 (운영사는 못 바꿈 — 바꾸려면 삭제 후 추가) */
export async function updateTipsMatchAction(
  matchId: number,
  companyId: number,
  valuationEok: number | null,
  investmentEok: number | null
): Promise<{ error?: string }> {
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

  const valuation =
    valuationEok != null && Number.isFinite(valuationEok)
      ? Math.round(valuationEok * 100)
      : null;
  const investment =
    investmentEok != null && Number.isFinite(investmentEok)
      ? Math.round(investmentEok * 100)
      : null;

  const { error } = await supabase
    .from("company_tips_matches")
    .update({ valuation, investment })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/tips");
  return {};
}

/** 매칭 삭제 */
export async function deleteTipsMatchAction(
  matchId: number,
  companyId: number
): Promise<{ error?: string }> {
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

  const { error } = await supabase.from("company_tips_matches").delete().eq("id", matchId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/tips");
  return {};
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
