"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인 필요" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false as const, error: "관리자 권한 필요" };
  return { ok: true as const, supabase };
}

/** 이메일 기준 profile 찾아서 company_id + role=company_member 로 매핑 */
export async function attachUserToCompany(
  companyId: number,
  email: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const e = email.trim().toLowerCase();
  if (!e) return { error: "이메일을 입력해주세요." };

  const { data: profile, error: findErr } = await auth.supabase
    .from("profiles")
    .select("id, email, role, company_id")
    .ilike("email", e)
    .maybeSingle();
  if (findErr) return { error: findErr.message };
  if (!profile) {
    return { error: `해당 이메일 사용자가 없습니다. ${e} 로 먼저 Google 로그인해주세요.` };
  }

  if (profile.role === "admin") {
    return { error: "관리자 계정은 기업 포털에 연결할 수 없습니다." };
  }

  const { error: updErr } = await auth.supabase
    .from("profiles")
    .update({ company_id: companyId, role: "company_member" })
    .eq("id", profile.id);
  if (updErr) return { error: updErr.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function detachUserFromCompany(
  userId: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();
  const companyId = profile?.company_id as number | null | undefined;

  const { error } = await auth.supabase
    .from("profiles")
    .update({ company_id: null })
    .eq("id", userId);
  if (error) return { error: error.message };

  if (companyId) revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}
