"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/applications";
import { revertAiChange } from "@/lib/ai-staff";

type Result = { error?: string };

/** 알림 완료/무시 처리 */
export async function resolvePostAction(id: string, status: "done" | "dismissed"): Promise<Result> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "권한 없음" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_staff_posts")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: admin.id })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/ai-staff");
  return {};
}

/** AI 변경 되돌리기 (companies·todos 등 여러 테이블을 건드려서 service role 사용) */
export async function revertChangeAction(id: string): Promise<Result> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "권한 없음" };
  const res = await revertAiChange(createAdminClient(), id, admin.id);
  if (res.error) return res;
  revalidatePath("/admin/ai-staff");
  return {};
}

/** 개선 요청 등록 */
export async function createRequestAction(body: string): Promise<Result> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "권한 없음" };
  const text = body.trim();
  if (!text) return { error: "내용을 입력해주세요." };
  if (text.length > 4000) return { error: "4000자 이하로 입력해주세요." };
  const supabase = await createClient();
  const { error } = await supabase.from("ai_staff_requests").insert({ body: text, requested_by: admin.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/ai-staff");
  return {};
}

/** 개선 요청 취소 (아직 처리 전인 것만) */
export async function cancelRequestAction(id: string): Promise<Result> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "권한 없음" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_staff_requests")
    .update({ status: "rejected", ai_reply: `${admin.name} 님이 취소`, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open");
  if (error) return { error: error.message };
  revalidatePath("/admin/ai-staff");
  return {};
}
