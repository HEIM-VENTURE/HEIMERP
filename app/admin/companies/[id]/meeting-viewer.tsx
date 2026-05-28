"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { regenerateSummaryAction } from "./meeting-actions";
import { MeetingTodoSuggestions } from "./meeting-todos";

export type MeetingRow = {
  id: number;
  company_id: number;
  sequence: string | null;
  title: string | null;
  meeting_date: string;
  attendees: string | null;
  body: string | null;
  ai_summary: string | null;
  ai_summary_at: string | null;
  ai_todos: string[] | null;
};

/**
 * 활동 피드 안에서 미팅 1건을 표시.
 * - AI 요약이 있으면 미리보기 + "전문 보기"
 * - 없으면 "전문 보기" + "AI 요약 생성"
 * 클릭 시 전체 회의록 + 요약을 모달로.
 */
export function MeetingViewer({ meeting }: { meeting: MeetingRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(meeting.ai_summary);
  const [todos, setTodos] = useState<string[]>(meeting.ai_todos ?? []);
  const [error, setError] = useState<string | null>(null);

  const onRegenerate = () => {
    setError(null);
    startTransition(async () => {
      const r = await regenerateSummaryAction(meeting.id);
      if ("error" in r) setError(r.error);
      else {
        setSummary(r.summary);
        setTodos(r.todos);
      }
    });
  };

  return (
    <div className="mt-2">
      {/* 요약 미리보기 (있으면) */}
      {summary ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
          <div className="font-semibold mb-1">✨ AI 요약</div>
          <pre className="whitespace-pre-wrap font-sans leading-relaxed line-clamp-4">{summary}</pre>
        </div>
      ) : (
        <div className="text-xs text-zinc-400 italic">AI 요약 없음</div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-zinc-600 hover:text-zinc-900 underline"
        >
          📄 회의록 전문 보기
        </button>
        {!summary ? (
          <button
            onClick={onRegenerate}
            disabled={pending}
            className="text-xs text-amber-700 hover:text-amber-900 underline disabled:opacity-50"
          >
            {pending ? "요약 생성 중..." : "✨ AI 요약 생성"}
          </button>
        ) : null}
      </div>
      {error ? <div className="text-xs text-rose-600 mt-1">{error}</div> : null}

      {/* AI 추출 To-do → 바로 추가 (피드에 인라인) */}
      <MeetingTodoSuggestions companyId={meeting.company_id} todos={todos} />

      {/* 전문 모달 */}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  {meeting.sequence ?? "미팅"}
                  {meeting.title ? ` — ${meeting.title}` : ""}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {meeting.meeting_date}
                  {meeting.attendees ? ` · 참석: ${meeting.attendees}` : ""}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* AI 요약 */}
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-amber-900">✨ AI 요약</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={pending}
                  className="text-xs h-7"
                >
                  {pending ? "생성 중..." : summary ? "재생성" : "요약 생성"}
                </Button>
              </div>
              {summary ? (
                <pre className="text-sm text-amber-900 whitespace-pre-wrap font-sans leading-relaxed">
                  {summary}
                </pre>
              ) : (
                <p className="text-xs text-amber-700">
                  아직 요약이 없습니다. &quot;요약 생성&quot;을 눌러주세요.
                </p>
              )}
              {error ? <div className="text-xs text-rose-600 mt-2">{error}</div> : null}
            </div>

            {/* 회의록 전문 */}
            <div>
              <div className="text-sm font-semibold text-zinc-900 mb-2">📄 회의록 전문</div>
              <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                {meeting.body || "(본문 없음)"}
              </pre>
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={() => setOpen(false)} variant="outline">
                닫기
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
