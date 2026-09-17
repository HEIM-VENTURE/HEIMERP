"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TappingField =
  | "prev_revenue"
  | "headcount"
  | "established_at"
  | "personal_fund_eligible"
  | "lips_eligible"
  | "tips_eligible"
  | "progress_status"
  | "confirmed_operator"
  | "pm"
  | "tapping_1"
  | "tapping_2"
  | "tapping_3"
  | "tapping_4"
  | "tapping_5"
  | "notes";

export const PM_OPTIONS = [
  "박대성",
  "강영환",
  "허유나",
  "이지우",
  "조상우",
  "권도준",
] as const;
export type PM = (typeof PM_OPTIONS)[number];

export async function updateTappingField(
  id: string,
  field: TappingField,
  value: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const clean = value.trim();
  const patch = { [field]: clean === "" ? null : clean };

  const { error } = await supabase
    .from("investor_tappings")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/deals");
  return { success: true };
}

export async function createTappingRow(
  companyName: string,
): Promise<{ error?: string; id?: string }> {
  const name = companyName?.trim();
  if (!name) return { error: "기업명을 입력해주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  // 다음 seq
  const { data: last } = await supabase
    .from("investor_tappings")
    .select("seq")
    .order("seq", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextSeq = ((last?.seq as number | null) ?? 0) + 1;

  // 기업 매칭
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  const { data, error } = await supabase
    .from("investor_tappings")
    .insert({
      seq: nextSeq,
      company_name_snapshot: name,
      company_id: company?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/deals");
  return { id: data.id as string };
}

export async function deleteTappingRow(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { error } = await supabase
    .from("investor_tappings")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/deals");
  return { success: true };
}
