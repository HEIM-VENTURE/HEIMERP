"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTodoAction(formData: FormData) {
  const supabase = await createClient();

  // 권한 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "제목이 비어있습니다" };

  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "").trim() || null;
  const companyIdRaw = String(formData.get("company_id") ?? "").trim();
  const companyId = companyIdRaw && companyIdRaw !== "none" ? Number(companyIdRaw) : null;

  const { error } = await supabase.from("todos").insert({
    title,
    description,
    due_date: dueDate,
    company_id: companyId,
    status: "pending",
    auto_generated: false,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/todos");
  revalidatePath("/admin/dashboard");
  if (companyId) revalidatePath(`/admin/companies/${companyId}`);

  return { success: true };
}

export async function toggleTodoStatusAction(todoId: number, currentStatus: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const nextStatus = currentStatus === "done" ? "pending" : "done";
  const completedAt = nextStatus === "done" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("todos")
    .update({ status: nextStatus, completed_at: completedAt })
    .eq("id", todoId);

  if (error) return { error: error.message };

  revalidatePath("/admin/todos");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteTodoAction(todoId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { error } = await supabase.from("todos").delete().eq("id", todoId);
  if (error) return { error: error.message };

  revalidatePath("/admin/todos");
  return { success: true };
}
