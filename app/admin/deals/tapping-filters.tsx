"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, User } from "lucide-react";
import { useCallback } from "react";
import { PM_OPTIONS } from "./tapping-actions";

export type TappingFilters = {
  q?: string;
  operator?: "all" | "assigned" | "unassigned";
  lips?: "all" | "yes" | "no" | "wait" | "none";
  tips?: "all" | "yes" | "no" | "wait" | "none";
  tapping?: "all" | "in_progress" | "none";
  pm?: string; // "all" | "mine" | "none" | 개별 이름
  sort?: "seq" | "name" | "updated";
  dir?: "asc" | "desc";
};

export function TappingFiltersBar({
  f,
  currentUserName,
}: {
  f: TappingFilters;
  currentUserName?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp?.toString() ?? "");
      params.set("view", "tapping");
      if (value === null || value === "" || value === "all") params.delete(key);
      else params.set(key, value);
      router.push(`/admin/deals?${params.toString()}`);
    },
    [router, sp],
  );

  const clearAll = () => {
    router.push(`/admin/deals?view=tapping`);
  };

  const activeCount = [
    f.q,
    f.operator && f.operator !== "all" ? f.operator : null,
    f.lips && f.lips !== "all" ? f.lips : null,
    f.tips && f.tips !== "all" ? f.tips : null,
    f.tapping && f.tapping !== "all" ? f.tapping : null,
    f.pm && f.pm !== "all" ? f.pm : null,
  ].filter(Boolean).length;

  const isPmMine = f.pm === "mine" || (currentUserName && f.pm === currentUserName);

  return (
    <div className="mb-4 space-y-2.5">
      {/* 검색 + 정렬 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            defaultValue={f.q ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => {
              if ((e.target.value ?? "") !== (f.q ?? "")) setParam("q", e.target.value);
            }}
            placeholder="기업명·운영사·태핑 대상자 검색 (Enter)"
            className="h-8 w-full pl-8 pr-3 rounded-md border border-zinc-300 text-[12.5px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <select
          value={f.sort ?? "seq"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="h-8 px-2 rounded-md border border-zinc-300 text-[12px] bg-white cursor-pointer"
          title="정렬 기준"
        >
          <option value="seq">순번순</option>
          <option value="name">기업명순</option>
          <option value="updated">최근 수정순</option>
        </select>
        <select
          value={f.dir ?? "asc"}
          onChange={(e) => setParam("dir", e.target.value)}
          className="h-8 px-2 rounded-md border border-zinc-300 text-[12px] bg-white cursor-pointer"
          title="정렬 방향"
        >
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[11.5px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          >
            <X className="w-3 h-3" />
            필터 초기화 ({activeCount})
          </button>
        ) : null}
      </div>

      {/* 필터 배지들 */}
      <div className="flex items-center gap-2 flex-wrap text-[12px]">
        <FilterGroup label="운영사">
          <Pill active={!f.operator || f.operator === "all"} onClick={() => setParam("operator", null)}>전체</Pill>
          <Pill active={f.operator === "assigned"} onClick={() => setParam("operator", "assigned")}>확정</Pill>
          <Pill active={f.operator === "unassigned"} onClick={() => setParam("operator", "unassigned")}>미지정</Pill>
        </FilterGroup>

        <FilterGroup label="LIPS">
          <Pill active={!f.lips || f.lips === "all"} onClick={() => setParam("lips", null)}>전체</Pill>
          <Pill active={f.lips === "yes"} onClick={() => setParam("lips", "yes")} tone="emerald">여</Pill>
          <Pill active={f.lips === "wait"} onClick={() => setParam("lips", "wait")} tone="amber">대기</Pill>
          <Pill active={f.lips === "no"} onClick={() => setParam("lips", "no")} tone="rose">부</Pill>
        </FilterGroup>

        <FilterGroup label="TIPS">
          <Pill active={!f.tips || f.tips === "all"} onClick={() => setParam("tips", null)}>전체</Pill>
          <Pill active={f.tips === "yes"} onClick={() => setParam("tips", "yes")} tone="emerald">여</Pill>
          <Pill active={f.tips === "wait"} onClick={() => setParam("tips", "wait")} tone="amber">대기</Pill>
          <Pill active={f.tips === "no"} onClick={() => setParam("tips", "no")} tone="rose">부</Pill>
        </FilterGroup>

        <FilterGroup label="태핑">
          <Pill active={!f.tapping || f.tapping === "all"} onClick={() => setParam("tapping", null)}>전체</Pill>
          <Pill active={f.tapping === "in_progress"} onClick={() => setParam("tapping", "in_progress")}>진행 중</Pill>
          <Pill active={f.tapping === "none"} onClick={() => setParam("tapping", "none")}>미시작</Pill>
        </FilterGroup>

        <FilterGroup label="담당">
          <Pill active={!f.pm || f.pm === "all"} onClick={() => setParam("pm", null)}>전체</Pill>
          {currentUserName && PM_OPTIONS.includes(currentUserName as (typeof PM_OPTIONS)[number]) ? (
            <Pill
              active={!!isPmMine}
              onClick={() => setParam("pm", currentUserName)}
              tone="emerald"
            >
              <span className="inline-flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                내 담당
              </span>
            </Pill>
          ) : null}
          <Pill active={f.pm === "none"} onClick={() => setParam("pm", "none")}>미지정</Pill>
          {PM_OPTIONS.map((name) => (
            <Pill
              key={name}
              active={f.pm === name}
              onClick={() => setParam("pm", name)}
            >
              {name}
            </Pill>
          ))}
        </FilterGroup>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-[10.5px] font-medium text-zinc-500 uppercase mr-0.5">{label}</span>
      <div className="inline-flex items-center gap-0.5 p-0.5 bg-zinc-100 rounded-md">
        {children}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "emerald" | "amber" | "rose";
}) {
  const toneCls = active
    ? tone === "emerald"
      ? "bg-emerald-500 text-white"
      : tone === "amber"
      ? "bg-amber-500 text-white"
      : tone === "rose"
      ? "bg-rose-500 text-white"
      : "bg-white text-zinc-900 shadow-sm"
    : "text-zinc-600 hover:text-zinc-900";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[11.5px] font-medium transition-colors ${toneCls}`}
    >
      {children}
    </button>
  );
}
