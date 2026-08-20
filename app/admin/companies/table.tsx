"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
} from "@/lib/labels";

type SalesStageKey = keyof typeof SALES_STAGE_LABELS;
type ConsultingStageKey = keyof typeof CONSULTING_STAGE_LABELS;

export type CompanyRow = {
  id: number;
  name: string;
  ceo_name: string | null;
  founded_at: string | null;
  sales_stage: SalesStageKey;
  consulting_stage: ConsultingStageKey | null;
  source: string | null;
  notes: string | null;
  received_at: string;
  consultant_id: string | null;
  program_grade: string | null;
};

type StageFilter = "all" | SalesStageKey;
type SourceFilter = "all" | "paid_customers" | "manual" | "tally" | "google_form" | "other";
type ConsultantFilter = "all" | "assigned" | "unassigned";

export function CompaniesTable({ rows }: { rows: CompanyRow[] }) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [consultant, setConsultant] = useState<ConsultantFilter>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (stage !== "all" && r.sales_stage !== stage) return false;
      if (source !== "all") {
        if (source === "other") {
          if (
            r.source === "paid_customers" ||
            r.source === "manual" ||
            r.source === "tally" ||
            r.source === "google_form"
          )
            return false;
        } else if (r.source !== source) return false;
      }
      if (consultant === "assigned" && !r.consultant_id) return false;
      if (consultant === "unassigned" && r.consultant_id) return false;
      if (needle) {
        const hay = [r.name, r.ceo_name, r.notes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, q, stage, source, consultant]);

  return (
    <>
      {/* 필터 바 */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="회사명 · 대표자 · 메모 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-200 text-[13px] focus:outline-none focus:border-brand"
          />
        </div>

        <FilterGroup
          label="영업"
          value={stage}
          options={[
            { key: "all", label: "전체" },
            { key: "received", label: "접수" },
            { key: "meeting_1st", label: "1차미팅" },
            { key: "proposal", label: "제안" },
            { key: "contract", label: "계약" },
            { key: "kickoff", label: "착수" },
          ]}
          onChange={(v) => setStage(v as StageFilter)}
        />

        <FilterGroup
          label="유입"
          value={source}
          options={[
            { key: "all", label: "전체" },
            { key: "paid_customers", label: "현황표" },
            { key: "manual", label: "수동" },
            { key: "tally", label: "Tally" },
            { key: "google_form", label: "폼" },
            { key: "other", label: "기타" },
          ]}
          onChange={(v) => setSource(v as SourceFilter)}
        />

        <FilterGroup
          label="담당"
          value={consultant}
          options={[
            { key: "all", label: "전체" },
            { key: "assigned", label: "배정" },
            { key: "unassigned", label: "미배정" },
          ]}
          onChange={(v) => setConsultant(v as ConsultantFilter)}
        />

        <span className="ml-auto text-[12px] text-zinc-500">
          {filtered.length} / {rows.length}건
        </span>
      </div>

      {/* 표 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-auto max-h-[calc(100vh-18rem)] sm:max-h-[calc(100vh-16rem)] lg:max-h-[calc(100vh-13rem)]">
        <div>
          <table className="min-w-[900px] w-full text-[13px]">
            <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(228_228_231)]">
              <tr>
                <Th w="w-64">회사명</Th>
                <Th w="w-28">대표자</Th>
                <Th w="w-28">설립일</Th>
                <Th w="w-24">영업 단계</Th>
                <Th w="w-32">컨설팅 단계</Th>
                <Th w="w-20">유입</Th>
                <Th>메모</Th>
                <Th w="w-10">{" "}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/70 transition-colors align-top">
                  <Td>
                    <Link
                      href={`/admin/companies/${r.id}`}
                      className="font-medium text-zinc-900 hover:text-brand hover:underline"
                    >
                      {r.name}
                    </Link>
                  </Td>
                  <Td>
                    {r.ceo_name ? (
                      <span className="text-zinc-700">{r.ceo_name}</span>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </Td>
                  <Td>
                    {r.founded_at ? (
                      <span className="tabular-nums text-zinc-600 text-[12px]">
                        {r.founded_at}
                      </span>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </Td>
                  <Td>
                    <StageBadge stage={r.sales_stage} />
                  </Td>
                  <Td>
                    {r.consulting_stage ? (
                      <span className="text-[11.5px] text-zinc-700">
                        {CONSULTING_STAGE_LABELS[r.consulting_stage] ?? r.consulting_stage}
                      </span>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </Td>
                  <Td>
                    <SourceBadge value={r.source} />
                  </Td>
                  <Td>
                    {r.notes ? (
                      <span
                        className="text-[11.5px] text-zinc-600 line-clamp-2 whitespace-pre-line"
                        title={r.notes}
                      >
                        {r.notes}
                      </span>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/companies/${r.id}`}
                      className="inline-flex items-center p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900"
                      aria-label="상세 열기"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-zinc-400">
              필터 결과가 없습니다.
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Small pieces
// ─────────────────────────────────────────────
function Th({ children, w }: { children: React.ReactNode; w?: string }) {
  return <th className={`text-left px-3 py-2.5 font-medium ${w ?? ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className ?? ""}`}>{children}</td>;
}

function StageBadge({ stage }: { stage: SalesStageKey }) {
  const label = SALES_STAGE_LABELS[stage] ?? stage;
  const c = SALES_STAGE_COLORS[stage];
  if (!c) return <span className="text-[11px] text-zinc-500">{label}</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium ${c.badge}`}
    >
      <span className={`w-1 h-1 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}

const SOURCE_LABELS: Record<string, { label: string; badge: string }> = {
  paid_customers: { label: "현황표", badge: "bg-emerald-50 text-emerald-700" },
  manual: { label: "수동", badge: "bg-zinc-100 text-zinc-600" },
  tally: { label: "Tally", badge: "bg-indigo-50 text-indigo-700" },
  google_form: { label: "폼", badge: "bg-sky-50 text-sky-700" },
};

function SourceBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-zinc-300">-</span>;
  const meta = SOURCE_LABELS[value] ?? { label: value, badge: "bg-zinc-100 text-zinc-600" };
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-medium ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

function FilterGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-1 py-0.5">
      <span className="text-[10.5px] text-zinc-400 pl-1.5 pr-0.5">{label}</span>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={String(o.key)}
            type="button"
            onClick={() => onChange(o.key)}
            className={`px-2 py-0.5 rounded text-[11.5px] transition-colors ${
              active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
