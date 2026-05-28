"use client";

import { useState, useTransition } from "react";
import { addMeetingTodosAction } from "./meeting-actions";

/**
 * 미팅 AI가 추출한 To-do 후보 목록.
 * 개별 추가 / 전체 추가 버튼 제공. 추가된 항목은 체크 표시.
 */
export function MeetingTodoSuggestions({
  companyId,
  todos,
}: {
  companyId: number;
  todos: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (!todos || todos.length === 0) return null;

  const addOne = (idx: number) => {
    setError(null);
    startTransition(async () => {
      const r = await addMeetingTodosAction(companyId, [todos[idx]]);
      if ("error" in r) setError(r.error);
      else setAdded((prev) => new Set(prev).add(idx));
    });
  };

  const addAll = () => {
    setError(null);
    const remaining = todos.filter((_, i) => !added.has(i));
    if (remaining.length === 0) return;
    startTransition(async () => {
      const r = await addMeetingTodosAction(companyId, remaining);
      if ("error" in r) setError(r.error);
      else setAdded(new Set(todos.map((_, i) => i)));
    });
  };

  const allAdded = added.size >= todos.length;

  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-blue-900">
          ✅ 대표님 To-do 후보 ({todos.length})
        </div>
        <button
          onClick={addAll}
          disabled={pending || allAdded}
          className="text-[11px] px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {allAdded ? "전체 추가됨" : pending ? "추가 중..." : "전체 To-do로 추가"}
        </button>
      </div>
      <ul className="space-y-1.5">
        {todos.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-blue-900">
            <span className="mt-0.5">{added.has(i) ? "✅" : "•"}</span>
            <span className="flex-1">{t}</span>
            {added.has(i) ? (
              <span className="text-[10px] text-blue-500 shrink-0">추가됨</span>
            ) : (
              <button
                onClick={() => addOne(i)}
                disabled={pending}
                className="text-[10px] text-blue-700 hover:text-blue-900 underline shrink-0 disabled:opacity-50"
              >
                + 추가
              </button>
            )}
          </li>
        ))}
      </ul>
      {error ? <div className="text-[11px] text-rose-600 mt-1.5">{error}</div> : null}
      <div className="text-[10px] text-blue-400 mt-2">
        💡 추가하면 이 기업의 To-do 목록에 등록됩니다 (마감일은 나중에 설정).
      </div>
    </div>
  );
}
