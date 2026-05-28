"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Opt = { value: string; label: string };

/**
 * To-do 다차원 필터 바 (담당 PM / HVP / 기업 / 단계).
 * URL 쿼리 파라미터로 동작 — 다른 필터(filter/auto/cat)는 보존.
 */
export function TodoFilters({
  pms,
  hvps,
  companies,
  stages,
  current,
}: {
  pms: string[];
  hvps: { id: string; name: string }[];
  companies: { id: number; name: string }[];
  stages: Opt[];
  current: { pm: string; hvp: string; company: string; stage: string };
}) {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value === "all") p.delete(key);
    else p.set(key, value);
    router.push(`/admin/todos?${p.toString()}`);
  };

  const anyActive =
    current.pm !== "all" || current.hvp !== "all" || current.company !== "all" || current.stage !== "all";

  const reset = () => {
    const p = new URLSearchParams(params.toString());
    ["pm", "hvp", "company", "stage"].forEach((k) => p.delete(k));
    router.push(`/admin/todos?${p.toString()}`);
  };

  const sel = "text-xs border border-zinc-200 rounded-lg px-2 py-1.5 bg-white max-w-[160px]";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <select value={current.pm} onChange={(e) => setParam("pm", e.target.value)} className={sel}>
        <option value="all">담당 PM — 전체</option>
        {pms.map((p) => (
          <option key={p} value={p}>
            PM: {p}
          </option>
        ))}
      </select>

      <select value={current.hvp} onChange={(e) => setParam("hvp", e.target.value)} className={sel}>
        <option value="all">HVP — 전체</option>
        {hvps.map((h) => (
          <option key={h.id} value={h.id}>
            HVP: {h.name}
          </option>
        ))}
      </select>

      <select value={current.company} onChange={(e) => setParam("company", e.target.value)} className={sel}>
        <option value="all">기업 — 전체</option>
        {companies.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.name}
          </option>
        ))}
      </select>

      <select value={current.stage} onChange={(e) => setParam("stage", e.target.value)} className={sel}>
        <option value="all">단계 — 전체</option>
        {stages.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {anyActive ? (
        <button onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-900 underline">
          필터 초기화
        </button>
      ) : null}
    </div>
  );
}
