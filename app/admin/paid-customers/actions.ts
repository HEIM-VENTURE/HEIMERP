"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// paid_customers 테이블에서 편집 가능한 컬럼만 화이트리스트로 관리한다.
// id/no/company_id/created_at/updated_at 은 편집 불가.
const EDITABLE_TEXT_FIELDS = [
  "company_name",
  "new_corp_setup",
  "new_company_name",
  "target_program",
  "legal_name",
  "established_at",
  "headcount",
  "ir_deck_tips",
  "ir_deck_lips",
  "demoday_1_a",
  "demoday_1_b",
  "demoday_2_a",
  "demoday_2_b",
  "offline",
  "memo",
] as const;

type TextField = (typeof EDITABLE_TEXT_FIELDS)[number];

export type PaidCustomerPatch = Partial<
  Record<TextField, string | null> & {
    is_paid: boolean | null;
    urgency: number | null;
  }
>;

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인 세션이 만료되었습니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return { ok: false as const, error: "관리자 권한이 필요합니다." };
  }
  return { ok: true as const, supabase };
}

function sanitize(patch: PaidCustomerPatch): PaidCustomerPatch | { error: string } {
  const clean: PaidCustomerPatch = {};

  for (const key of Object.keys(patch) as (keyof PaidCustomerPatch)[]) {
    if (key === "is_paid") {
      const v = patch.is_paid;
      if (v !== null && typeof v !== "boolean") {
        return { error: "결제여부는 true/false/null 만 허용됩니다." };
      }
      clean.is_paid = v ?? null;
      continue;
    }
    if (key === "urgency") {
      const v = patch.urgency;
      if (v !== null && v !== undefined) {
        if (!Number.isInteger(v) || v < 1 || v > 5) {
          return { error: "긴급도는 1~5 사이 정수여야 합니다." };
        }
      }
      clean.urgency = v ?? null;
      continue;
    }
    if ((EDITABLE_TEXT_FIELDS as readonly string[]).includes(key as string)) {
      const raw = patch[key as TextField];
      const trimmed = typeof raw === "string" ? raw.trim() : raw;
      clean[key as TextField] = trimmed === "" ? null : (trimmed as string | null);
      continue;
    }
    return { error: `허용되지 않은 필드입니다: ${key}` };
  }

  return clean;
}

export async function updatePaidCustomer(
  id: string,
  patch: PaidCustomerPatch,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "id가 없습니다." };

  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const sanitized = sanitize(patch);
  if ("error" in sanitized) return { ok: false, error: sanitized.error };
  if (Object.keys(sanitized).length === 0) return { ok: true };

  const { error } = await auth.supabase
    .from("paid_customers")
    .update(sanitized)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/paid-customers");
  return { ok: true };
}

/**
 * 새 결제 고객(기업) 한 줄 추가.
 * 기업명만 필수. 다음 no 값 자동 채움.
 * companyId 넘기면 기존 companies 행과 연결 (선택).
 */
export async function createPaidCustomer(
  companyName: string,
  companyId?: number | null,
): Promise<ActionResult & { id?: string }> {
  const name = companyName?.trim();
  if (!name) return { ok: false, error: "기업명을 입력해주세요." };

  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  // 다음 no 값 계산 (기존 max + 1)
  const { data: last } = await auth.supabase
    .from("paid_customers")
    .select("no")
    .order("no", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextNo = ((last?.no as number | null) ?? 0) + 1;

  const { data, error } = await auth.supabase
    .from("paid_customers")
    .insert({
      company_name: name,
      no: nextNo,
      company_id: companyId ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/paid-customers");
  return { ok: true, id: data.id as string };
}
