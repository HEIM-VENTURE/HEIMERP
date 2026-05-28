"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMeetingAction } from "./meeting-actions";
import { MeetingTodoSuggestions } from "./meeting-todos";
import { MarkdownView } from "./markdown-view";

type Props = {
  companyId: number;
};

export function NewMeetingModal({ companyId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    aiSummary?: string;
    aiTodos?: string[];
    aiError?: string;
  } | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    setResult(null);
    formData.set("company_id", String(companyId));
    startTransition(async () => {
      const r = await createMeetingAction(formData);
      if ("error" in r) {
        setError(r.error);
      } else if (r.aiSummary || r.aiError) {
        // 요약 성공/실패 결과를 보여주고 사용자가 닫게 함 (미팅은 이미 저장됨)
        setResult({ aiSummary: r.aiSummary, aiTodos: r.aiTodos, aiError: r.aiError });
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        + 미팅·회의록
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">미팅·회의록 추가</h3>
                <p className="text-xs text-zinc-500 mt-1">회의록 본문을 입력하면 AI가 자동으로 요약합니다 (선택)</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-900 text-xl leading-none">
                ×
              </button>
            </div>

            {result?.aiSummary ? (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-sm font-semibold text-emerald-900 mb-2">✨ AI 회의록 정리 완료!</div>
                <div className="max-h-72 overflow-y-auto">
                  <MarkdownView text={result.aiSummary} className="text-emerald-950" />
                </div>
                {result.aiTodos && result.aiTodos.length > 0 ? (
                  <MeetingTodoSuggestions companyId={companyId} todos={result.aiTodos} />
                ) : null}
                <Button onClick={() => setOpen(false)} className="mt-3" size="sm">
                  닫기
                </Button>
              </div>
            ) : result?.aiError ? (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-sm font-semibold text-amber-900 mb-1">
                  ⚠️ 회의록은 저장됐지만 AI 요약은 실패했어요
                </div>
                <p className="text-xs text-amber-800 mb-2">
                  사유: {result.aiError}
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  나중에 회의록 상세에서 &quot;AI 요약 재생성&quot;으로 다시 시도할 수 있어요.
                </p>
                <Button onClick={() => setOpen(false)} className="mt-1" size="sm">
                  닫기
                </Button>
              </div>
            ) : null}

            <form action={onSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="sequence" className="text-xs font-medium text-zinc-700 mb-1 block">차수</Label>
                  <select
                    id="sequence"
                    name="sequence"
                    defaultValue="1차"
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
                  >
                    <option value="1차">1차</option>
                    <option value="2차">2차</option>
                    <option value="3차">3차</option>
                    <option value="4차+">4차+</option>
                    <option value="내부">내부</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="meeting_date" className="text-xs font-medium text-zinc-700 mb-1 block">일자 *</Label>
                  <Input
                    id="meeting_date"
                    name="meeting_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title" className="text-xs font-medium text-zinc-700 mb-1 block">제목</Label>
                  <Input id="title" name="title" placeholder="IR Deck 검토" />
                </div>
              </div>

              <div>
                <Label htmlFor="attendees" className="text-xs font-medium text-zinc-700 mb-1 block">참석자</Label>
                <Input id="attendees" name="attendees" placeholder="예: 이지원(대표), 김민준(HVP), 정수정(컨설턴트)" />
              </div>

              <div>
                <Label htmlFor="body" className="text-xs font-medium text-zinc-700 mb-1 block">회의록 본문 *</Label>
                <textarea
                  id="body"
                  name="body"
                  rows={8}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 font-mono"
                  placeholder="회의 내용을 그대로 입력하세요. AI가 자동으로 핵심만 요약합니다."
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <input
                  type="checkbox"
                  id="ai_summary"
                  name="ai_summary"
                  defaultChecked
                  className="rounded border-amber-400"
                />
                <Label htmlFor="ai_summary" className="text-xs text-amber-900 cursor-pointer">
                  ✨ AI 자동 요약 생성 (Gemini Flash, 무료)
                </Label>
              </div>

              {error ? (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-2 mt-6 pt-3 border-t border-zinc-100">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={pending}>
                  취소
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
