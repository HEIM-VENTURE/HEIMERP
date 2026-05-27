"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useTransition } from "react";
import {
  SALES_STAGE_LABELS,
  SALES_STAGES_ORDER,
  CONSULTING_STAGE_LABELS,
  CONSULTING_STAGES_ORDER,
  PROGRAM_GRADE_LABELS,
} from "@/lib/labels";

type Props = {
  initialQuery: string;
  initialStage: string;
  initialGrade: string;
  initialConsulting: string;
  resultCount: number;
};

export function PipelineFilters({
  initialQuery,
  initialStage,
  initialGrade,
  initialConsulting,
  resultCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const onSearchChange = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => updateParam("q", value), 300);
  };

  const hasActiveFilters =
    initialQuery || initialStage !== "all" || initialGrade !== "all" || initialConsulting !== "all";

  const clearAll = () => {
    startTransition(() => router.push(pathname, { scroll: false }));
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* 검색 */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="회사명·아이템·소재지 검색…"
            defaultValue={initialQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>

        {/* 영업 단계 */}
        <select
          value={initialStage}
          onChange={(e) => updateParam("stage", e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white cursor-pointer"
        >
          <option value="all">단계: 전체</option>
          {SALES_STAGES_ORDER.map((s) => (
            <option key={s} value={s}>
              단계: {SALES_STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        {/* 컨설팅 단계 */}
        <select
          value={initialConsulting}
          onChange={(e) => updateParam("consulting", e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white cursor-pointer"
        >
          <option value="all">컨설팅: 전체</option>
          <option value="none">컨설팅: 없음</option>
          {CONSULTING_STAGES_ORDER.map((s) => (
            <option key={s} value={s}>
              컨설팅: {CONSULTING_STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        {/* 등급 */}
        <select
          value={initialGrade}
          onChange={(e) => updateParam("grade", e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white cursor-pointer"
        >
          <option value="all">등급: 전체</option>
          <option value="premium">등급: Premium</option>
          <option value="basic">등급: Basic</option>
          <option value="free">등급: Free</option>
          <option value="none">등급: 미정</option>
        </select>

        {hasActiveFilters ? (
          <button
            onClick={clearAll}
            className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg"
            disabled={pending}
          >
            초기화
          </button>
        ) : null}
      </div>

      <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
        {pending ? <span className="text-blue-600">불러오는 중…</span> : <span>{resultCount}개 표시</span>}
        {hasActiveFilters ? <span className="text-zinc-400">· 필터 적용됨</span> : null}
      </div>
    </div>
  );
}
