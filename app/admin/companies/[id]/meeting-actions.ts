"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { summarizeMeetingNotes } from "@/lib/gemini";

type CreateMeetingResult =
  | { success: true; meetingId: number; aiSummary?: string; aiError?: string }
  | { error: string };

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

  // 회사 정보 조회 (컨텍스트용)
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  // AI 요약 생성 (옵션)
  let aiSummary: string | null = null;
  let aiSummaryAt: string | null = null;
  let aiError: string | null = null;
  if (wantAiSummary) {
    try {
      aiSummary = await summarizeMeetingNotes(body, {
        companyName: company?.name,
        meetingType: sequence ?? undefined,
        attendees: attendees ?? undefined,
      });
      aiSummaryAt = new Date().toISOString();
    } catch (e) {
      console.error("[AI 요약 실패]", e);
      // 요약 실패해도 미팅은 저장하되, 실패 사유를 사용자에게 알림
      aiError = e instanceof Error ? e.message : "AI 요약 생성 실패";
    }
  }

  // INSERT
  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      company_id: companyId,
      sequence,
      title,
      meeting_date: meetingDate,
      attendees,
      body,
      ai_summary: aiSummary,
      ai_summary_at: aiSummaryAt,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/hvp/companies/${companyId}`);
  return {
    success: true,
    meetingId: meeting.id,
    aiSummary: aiSummary ?? undefined,
    aiError: aiError ?? undefined,
  };
}

export async function regenerateSummaryAction(meetingId: number): Promise<{ success: true; summary: string } | { error: string }> {
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
    const summary = await summarizeMeetingNotes(meeting.body, {
      companyName: meeting.companies?.name,
      meetingType: meeting.sequence,
      attendees: meeting.attendees,
    });

    await supabase
      .from("meetings")
      .update({ ai_summary: summary, ai_summary_at: new Date().toISOString() })
      .eq("id", meetingId);

    revalidatePath(`/admin/companies/${meeting.company_id}`);
    revalidatePath(`/hvp/companies/${meeting.company_id}`);
    return { success: true, summary };
  } catch (e: any) {
    return { error: `AI 요약 실패: ${e?.message ?? "알 수 없음"}` };
  }
}
