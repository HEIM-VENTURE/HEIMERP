"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인 필요" };
  return { ok: true as const, supabase, user };
}

export async function createCompanyNote(
  companyId: number,
  body: string,
): Promise<{ error?: string; id?: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };
  const text = body?.trim();
  if (!text) return { error: "노트 내용을 입력해주세요." };

  const { data, error } = await auth.supabase
    .from("company_notes")
    .insert({ company_id: companyId, author_id: auth.user.id, body: text })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  return { id: data.id as string };
}

export async function updateCompanyNote(
  id: string,
  companyId: number,
  body: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };
  const text = body?.trim();
  if (!text) return { error: "노트 내용을 입력해주세요." };

  const { error } = await auth.supabase
    .from("company_notes")
    .update({ body: text })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function deleteCompanyNote(
  id: string,
  companyId: number,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase.from("company_notes").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function toggleCompanyNotePin(
  id: string,
  companyId: number,
  pinned: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("company_notes")
    .update({ pinned })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}
