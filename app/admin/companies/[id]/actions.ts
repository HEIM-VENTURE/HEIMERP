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
  if (profile?.role !== "admin") {
    return { error: "관리자 권한 필요" };
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

/** 새 TIPS/LIPS 매칭 추가. (company_id, tips_operator_id, program) UNIQUE. */
export async function addTipsMatchAction(
  companyId: number,
  operatorId: string,
  valuationEok: number | null = null,
  investmentEok: number | null = null,
  program: "TIPS" | "LIPS" = "TIPS"
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
    .insert({
      company_id: companyId,
      tips_operator_id: operatorId,
      valuation,
      investment,
      program,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { error: `이미 ${program}으로 매칭된 운영사입니다` };
    return { error: error.message };
  }

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/tips");
  return { id: data.id as number };
}

/** 기존 매칭의 밸류·투자금액·program 갱신 (운영사는 못 바꿈 — 바꾸려면 삭제 후 추가) */
export async function updateTipsMatchAction(
  matchId: number,
  companyId: number,
  valuationEok: number | null,
  investmentEok: number | null,
  program?: "TIPS" | "LIPS"
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

  const update: { valuation: number | null; investment: number | null; program?: "TIPS" | "LIPS" } = {
    valuation,
    investment,
  };
  if (program) update.program = program;

  const { error } = await supabase
    .from("company_tips_matches")
    .update(update)
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

// ─────────────────────────────────────────────
// 기업 마스터 인라인 편집 (기본 정보 카드용)
// ─────────────────────────────────────────────
const EDITABLE_COMPANY_FIELDS = [
  "name",
  "ceo_name",
  "phone",
  "email",
  "address",
  "main_item",
  "founded_at",
  "last_year_revenue",
  "inquiry_purpose",
  "notes",
] as const;
type EditableCompanyField = (typeof EDITABLE_COMPANY_FIELDS)[number];

export type CompanyPatch = Partial<Record<EditableCompanyField, string | number | null>>;

export async function updateCompanyField(
  companyId: number,
  patch: CompanyPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!companyId) return { ok: false, error: "companyId 없음" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인 세션이 만료되었습니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "관리자 권한이 필요합니다." };
  }

  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as EditableCompanyField[]) {
    if (!(EDITABLE_COMPANY_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, error: `허용되지 않은 필드: ${key}` };
    }
    const raw = patch[key];

    if (key === "last_year_revenue") {
      if (raw === null || raw === "" || raw === undefined) {
        clean[key] = null;
      } else {
        const num = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
        if (!Number.isFinite(num)) {
          return { ok: false, error: "매출은 숫자여야 합니다." };
        }
        clean[key] = num;
      }
      continue;
    }

    if (key === "founded_at") {
      if (raw === null || raw === "" || raw === undefined) {
        clean[key] = null;
      } else if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
        clean[key] = raw.trim();
      } else {
        return { ok: false, error: "설립일은 YYYY-MM-DD 형식이어야 합니다." };
      }
      continue;
    }

    // 텍스트 필드
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    if (key === "name") {
      if (!trimmed) return { ok: false, error: "회사명은 비울 수 없습니다." };
      clean[key] = trimmed;
    } else {
      clean[key] = trimmed === "" ? null : trimmed;
    }
  }

  if (Object.keys(clean).length === 0) return { ok: true };

  const { error } = await supabase
    .from("companies")
    .update(clean)
    .eq("id", companyId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/companies");
  revalidatePath("/admin/pipeline");
  return { ok: true };
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
