"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { summarizeMeetingNotes } from "@/lib/gemini";

type CreateMeetingResult =
  | { success: true; meetingId: number; wantAi: boolean }
  | { error: string };

/**
 * 미팅(회의록) 저장 — AI 요약은 하지 않는다(빠르게 저장만).
 * AI 요약은 클라이언트가 저장 직후 별도 요청(regenerateSummaryAction)으로 호출.
 * → 서버리스 함수 시간제한(~10초) 안에 각 요청이 안전하게 들어감.
 */
export async function createMeetingAction(formData: FormData): Promise<CreateMeetingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const companyId = Number(formData.get("company_id"));
  if (!companyId) return { error: "기업 ID 누락" };

  const sequence = String(formData.get("sequence") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim() || null;
  const meetingDate = String(formData.get("meeting_date") ?? "").trim();
  if (!meetingDate) return { error: "회의 일자가 비어있습니다" };

  const attendees = String(formData.get("attendees") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "회의록 본문이 비어있습니다" };

  const wantAiSummary = formData.get("ai_summary") === "on";

  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      company_id: companyId,
      sequence,
      title,
      meeting_date: meetingDate,
      attendees,
      body,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/hvp/companies/${companyId}`);
  return { success: true, meetingId: meeting.id, wantAi: wantAiSummary };
}

export async function regenerateSummaryAction(
  meetingId: number
): Promise<{ success: true; summary: string; todos: string[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, companies(name)")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "미팅을 찾을 수 없습니다" };
  if (!meeting.body) return { error: "회의록 본문이 비어있어 요약 불가" };

  try {
    const result = await summarizeMeetingNotes(meeting.body, {
      companyName: meeting.companies?.name,
      meetingType: meeting.sequence,
      attendees: meeting.attendees,
    });

    await supabase
      .from("meetings")
      .update({
        ai_summary: result.summary,
        ai_summary_at: new Date().toISOString(),
        ai_todos: result.todos,
      })
      .eq("id", meetingId);

    revalidatePath(`/admin/companies/${meeting.company_id}`);
    revalidatePath(`/hvp/companies/${meeting.company_id}`);
    return { success: true, summary: result.summary, todos: result.todos };
  } catch (e: any) {
    return { error: `AI 요약 실패: ${e?.message ?? "알 수 없음"}` };
  }
}

/**
 * 미팅(회의록) 삭제.
 */
export async function deleteMeetingAction(
  meetingId: number
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  // company_id 확보 (revalidate용)
  const { data: meeting } = await supabase
    .from("meetings")
    .select("company_id")
    .eq("id", meetingId)
    .single();

  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) return { error: error.message };

  if (meeting?.company_id) {
    revalidatePath(`/admin/companies/${meeting.company_id}`);
    revalidatePath(`/hvp/companies/${meeting.company_id}`);
  }
  return { success: true };
}

/**
 * 미팅에서 추출한 To-do 후보들을 todos 테이블에 추가.
 * 대표/HVP가 확인 후 한 번에/개별 추가.
 */
export async function addMeetingTodosAction(
  companyId: number,
  titles: string[],
  dueDate?: string | null
): Promise<{ success: true; added: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const clean = titles.map((t) => t.trim()).filter((t) => t.length > 0);
  if (clean.length === 0) return { error: "추가할 To-do가 없습니다" };

  const rows = clean.map((title) => ({
    company_id: companyId,
    title,
    due_date: dueDate || null,
    status: "pending" as const,
    auto_generated: true,
    trigger_stage: "meeting_ai",
  }));

  const { error } = await supabase.from("todos").insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/hvp/companies/${companyId}`);
  revalidatePath("/admin/todos");
  revalidatePath("/admin/dashboard");
  return { success: true, added: clean.length };
}
