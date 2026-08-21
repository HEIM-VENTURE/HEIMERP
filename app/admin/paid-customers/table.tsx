"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, LinkIcon, PanelRightOpen, Columns3, Check as CheckIcon } from "lucide-react";
import { SALES_STAGE_LABELS, SALES_STAGE_COLORS } from "@/lib/labels";
import {
  TextEditCell,
  PaidToggleCell,
  UrgencySelectCell,
  ProgramCheckCell,
  statusBadge,
} from "./edit-cells";
import { PaidCustomerDetailPanel, type DetailPanelRow } from "./detail-panel";

type SalesStageKey = keyof typeof SALES_STAGE_LABELS;

type PaidCustomer = DetailPanelRow & {
  company_id: number | null;
  company?: {
    id: number;
    name: string;
    sales_stage: string | null;
    consulting_stage: string | null;
  } | null;
};

type UrgencyFilter = "all" | 1 | 2 | 3;
type PaidFilter = "all" | "paid" | "unpaid";
type ProgramFilter =
  | "all"
  | "팁스"
  | "립스"
  | "투자"
  | "팁스만"
  | "립스만"
  | "투자만";
type PipelineFilter = "all" | "linked" | "unlinked";

function programSet(v: string | null): Set<string> {
  if (!v) return new Set();
  return new Set(v.split(",").map((s) => s.trim()).filter(Boolean));
}

// ── 컬럼 정의 ──
// key = state 저장·조건 렌더 식별자, label = 팝오버·헤더 텍스트, locked = 필수
type ColKey =
  | "no" | "name" | "pipeline" | "paid" | "urgency"
  | "tips" | "lips" | "invest"
  | "founded" | "headcount" | "new_corp"
  | "ir_tips" | "ir_lips" | "demoday_1" | "demoday_2" | "offline";

const COLUMNS: { key: ColKey; label: string; locked?: boolean }[] = [
  { key: "no",        label: "#" },
  { key: "name",      label: "회사명 · 법인명", locked: true },
  { key: "pipeline",  label: "파이프라인" },
  { key: "paid",      label: "결제" },
  { key: "urgency",   label: "긴급" },
  { key: "tips",      label: "팁스" },
  { key: "lips",      label: "립스" },
  { key: "invest",    label: "투자" },
  { key: "founded",   label: "설립일" },
  { key: "headcount", label: "인원" },
  { key: "new_corp",  label: "신규법인" },
  { key: "ir_tips",   label: "IR팁스" },
  { key: "ir_lips",   label: "IR립스" },
  { key: "demoday_1", label: "1차 데모데이" },
  { key: "demoday_2", label: "2차 데모데이" },
  { key: "offline",   label: "오프라인" },
];

const DEFAULT_VISIBLE: ColKey[] = COLUMNS.map((c) => c.key);
const COL_STORAGE_KEY = "heim-erp:paid-customers:visible-cols";

export function PaidCustomerTable({ rows }: { rows: PaidCustomer[] }) {
  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [paid, setPaid] = useState<PaidFilter>("all");
  const [program, setProgram] = useState<ProgramFilter>("all");
  const [pipeline, setPipeline] = useState<PipelineFilter>("all");
  const [q, setQ] = useState("");
  const [detailRow, setDetailRow] = useState<PaidCustomer | null>(null);

  // 표시 컬럼 상태 (localStorage 지속)
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(() => new Set(DEFAULT_VISIBLE));
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      const valid = new Set(COLUMNS.map((c) => c.key));
      const next = new Set<ColKey>();
      for (const k of parsed) if (valid.has(k as ColKey)) next.add(k as ColKey);
      // locked 컬럼은 무조건 켜져 있어야 함
      for (const c of COLUMNS) if (c.locked) next.add(c.key);
      if (next.size > 0) setVisibleCols(next);
    } catch {}
  }, []);
  const persistCols = (next: Set<ColKey>) => {
    setVisibleCols(next);
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {}
  };
  const toggleCol = (key: ColKey) => {
    const col = COLUMNS.find((c) => c.key === key);
    if (col?.locked) return;
    const next = new Set(visibleCols);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    persistCols(next);
  };
  const show = (key: ColKey) => visibleCols.has(key);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (urgency !== "all" && r.urgency !== urgency) return false;
      if (paid === "paid" && r.is_paid !== true) return false;
      if (paid === "unpaid" && r.is_paid !== false) return false;
      if (program !== "all") {
        const set = programSet(r.target_program);
        if (program.endsWith("만")) {
          const only = program.slice(0, 2);
          if (!(set.size === 1 && set.has(only))) return false;
        } else {
          if (!set.has(program)) return false;
        }
      }
      if (pipeline === "linked" && !r.company) return false;
      if (pipeline === "unlinked" && r.company) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = [r.company_name, r.legal_name, r.new_company_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, urgency, paid, program, pipeline, q]);

  const linkedCount = rows.filter((r) => !!r.company).length;
  const unlinkedCount = rows.length - linkedCount;

  async function handleExport() {
    const XLSX = await import("xlsx");
    const data = filtered.map((r) => ({
      "No.": r.no ?? "",
      "회사명": r.company_name ?? "",
      "파이프라인 단계": r.company
        ? (SALES_STAGE_LABELS[r.company.sales_stage as SalesStageKey] ?? "등록됨")
        : "미등록",
      "결제여부": r.is_paid === true ? "O" : r.is_paid === false ? "X" : "",
      "신규법인 설립": r.new_corp_setup ?? "",
      "신규회사명": r.new_company_name ?? "",
      "타깃 프로그램": r.target_program ?? "",
      "긴급도": r.urgency ?? "",
      "식별이름": r.legal_name ?? "",
      "설립일": r.established_at ?? "",
      "직원 수": r.headcount ?? "",
      "IR Deck (팁스)": r.ir_deck_tips ?? "",
      "IR Deck (립스)": r.ir_deck_lips ?? "",
      "1차 데모데이 (A)": r.demoday_1_a ?? "",
      "1차 데모데이 (B)": r.demoday_1_b ?? "",
      "2차 데모데이 (A)": r.demoday_2_a ?? "",
      "2차 데모데이 (B)": r.demoday_2_b ?? "",
      "오프라인": r.offline ?? "",
      "메모": r.memo ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    (ws["!cols"] as unknown) = [
      { wch: 5 }, { wch: 22 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "고객현황표");

    const today = new Date();
    const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(wb, `고객현황표_${yyyymmdd}.xlsx`);
  }

  return (
    <>
      {/* 필터 바 */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
        <input
          type="text"
          placeholder="회사명 / 법인명 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-200 text-[13px] w-full sm:w-64 focus:outline-none focus:border-brand"
        />
        <FilterGroup
          label="긴급도"
          value={urgency}
          options={[
            { key: "all", label: "전체" },
            { key: 1, label: "1" },
            { key: 2, label: "2" },
            { key: 3, label: "3" },
          ]}
          onChange={(v) => setUrgency(v as UrgencyFilter)}
        />
        <FilterGroup
          label="결제"
          value={paid}
          options={[
            { key: "all", label: "전체" },
            { key: "paid", label: "결제" },
            { key: "unpaid", label: "미결제" },
          ]}
          onChange={(v) => setPaid(v as PaidFilter)}
        />
        <FilterGroup
          label="프로그램"
          value={program}
          options={[
            { key: "all", label: "전체" },
            { key: "팁스", label: "팁스" },
            { key: "팁스만", label: "팁스만" },
            { key: "립스", label: "립스" },
            { key: "립스만", label: "립스만" },
            { key: "투자", label: "투자" },
            { key: "투자만", label: "투자만" },
          ]}
          onChange={(v) => setProgram(v as ProgramFilter)}
        />
        <FilterGroup
          label="파이프라인"
          value={pipeline}
          options={[
            { key: "all", label: "전체" },
            { key: "linked", label: `등록 ${linkedCount}` },
            { key: "unlinked", label: `미등록 ${unlinkedCount}` },
          ]}
          onChange={(v) => setPipeline(v as PipelineFilter)}
        />
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[12px] text-zinc-500">
            {filtered.length} / {rows.length}건
          </span>
          <ColumnPicker
            visibleCols={visibleCols}
            toggleCol={toggleCol}
            onAll={() => persistCols(new Set(COLUMNS.map((c) => c.key)))}
            onDefault={() => persistCols(new Set(DEFAULT_VISIBLE))}
          />
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-white text-[12px] font-medium hover:bg-zinc-800 transition-colors shrink-0"
            title="현재 필터된 목록을 엑셀 파일로 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            엑셀
          </button>
        </div>
      </div>

      {/* 표 — 컨테이너 자체가 x/y 스크롤. thead가 이 컨테이너 상단에 sticky.
          모바일은 상단 헤더가 크니 max-h를 더 여유있게, lg 이상은 타이트하게. */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-auto max-h-[calc(100vh-18rem)] sm:max-h-[calc(100vh-16rem)] lg:max-h-[calc(100vh-13rem)]">
        <div>
          <table
            className="w-full text-[12.5px]"
            style={{ minWidth: `${Math.max(600, visibleCols.size * 95 + 60)}px` }}
          >
            <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(228_228_231)]">
              <tr>
                {show("no")        && <Th w="w-10">#</Th>}
                {show("name")      && <Th w="w-56">회사명 · 법인명</Th>}
                {show("pipeline")  && <Th w="w-24">파이프라인</Th>}
                {show("paid")      && <Th w="w-16">결제</Th>}
                {show("urgency")   && <Th w="w-14">긴급</Th>}
                {show("tips")      && <Th w="w-14">팁스</Th>}
                {show("lips")      && <Th w="w-14">립스</Th>}
                {show("invest")    && <Th w="w-14">투자</Th>}
                {show("founded")   && <Th w="w-28">설립일</Th>}
                {show("headcount") && <Th w="w-24">인원</Th>}
                {show("new_corp")  && <Th w="w-24">신규법인</Th>}
                {show("ir_tips")   && <Th w="w-20">IR팁스</Th>}
                {show("ir_lips")   && <Th w="w-20">IR립스</Th>}
                {show("demoday_1") && <Th w="w-28">1차 데모데이</Th>}
                {show("demoday_2") && <Th w="w-28">2차 데모데이</Th>}
                {show("offline")   && <Th w="w-20">오프라인</Th>}
                <Th w="w-10">{" "}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/40 transition-colors align-top">
                  <Td hidden={!show("no")}>
                    <span className="tabular-nums text-zinc-400">{r.no ?? "-"}</span>
                  </Td>
                  <Td hidden={!show("name")}>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 min-w-0">
                        <TextEditCell
                          id={r.id}
                          field="company_name"
                          value={r.company_name}
                          render={(v) => (
                            <span className="font-medium text-zinc-900 truncate block">
                              {v ?? <span className="text-zinc-300">회사명 없음</span>}
                            </span>
                          )}
                        />
                      </div>
                      {r.company ? (
                        <Link
                          href={`/admin/companies/${r.company.id}`}
                          className="p-1 rounded hover:bg-brand/10 text-zinc-400 hover:text-brand shrink-0"
                          title={`${r.company.name} 기업 마스터로 이동`}
                        >
                          <LinkIcon className="w-3 h-3" />
                        </Link>
                      ) : null}
                    </div>
                    <TextEditCell
                      id={r.id}
                      field="legal_name"
                      value={r.legal_name}
                      placeholder="법인 등기명"
                      render={(v) =>
                        v ? (
                          <span className="text-[10.5px] text-zinc-400 truncate block">{v}</span>
                        ) : (
                          <span className="text-[10.5px] text-zinc-300">법인명 —</span>
                        )
                      }
                    />
                    {r.new_company_name ? (
                      <div className="text-[10.5px] text-brand mt-0.5">
                        신규: {r.new_company_name}
                      </div>
                    ) : null}
                  </Td>
                  <Td hidden={!show("pipeline")}>
                    <PipelineBadge company={r.company} />
                  </Td>
                  <Td hidden={!show("paid")}>
                    <PaidToggleCell id={r.id} value={r.is_paid} />
                  </Td>
                  <Td hidden={!show("urgency")}>
                    <UrgencySelectCell id={r.id} value={r.urgency} />
                  </Td>
                  <Td hidden={!show("tips")}>
                    <ProgramCheckCell id={r.id} kind="팁스" value={r.target_program} />
                  </Td>
                  <Td hidden={!show("lips")}>
                    <ProgramCheckCell id={r.id} kind="립스" value={r.target_program} />
                  </Td>
                  <Td hidden={!show("invest")}>
                    <ProgramCheckCell id={r.id} kind="투자" value={r.target_program} />
                  </Td>
                  <Td hidden={!show("founded")}>
                    <TextEditCell
                      id={r.id}
                      field="established_at"
                      value={r.established_at}
                      placeholder="YYYY-MM-DD"
                      render={(v) =>
                        v ? (
                          <span className="text-[11px] text-zinc-600 tabular-nums">{v}</span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )
                      }
                    />
                  </Td>
                  <Td hidden={!show("headcount")}>
                    <TextEditCell
                      id={r.id}
                      field="headcount"
                      value={r.headcount}
                      placeholder="예: 6명"
                      render={(v) =>
                        v ? (
                          <span className="text-[11px] text-zinc-600">{v}</span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )
                      }
                    />
                  </Td>
                  <Td hidden={!show("new_corp")}>
                    <TextEditCell
                      id={r.id}
                      field="new_corp_setup"
                      value={r.new_corp_setup}
                      placeholder="O · ? · 설립예정"
                      render={(v) =>
                        v ? (
                          <span className="text-[11px] text-zinc-700">{v}</span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )
                      }
                    />
                  </Td>
                  <Td hidden={!show("ir_tips")}>
                    <TextEditCell
                      id={r.id}
                      field="ir_deck_tips"
                      value={r.ir_deck_tips}
                      placeholder="O · 1주후"
                      render={statusBadge}
                    />
                  </Td>
                  <Td hidden={!show("ir_lips")}>
                    <TextEditCell
                      id={r.id}
                      field="ir_deck_lips"
                      value={r.ir_deck_lips}
                      placeholder="O · 2주후"
                      render={statusBadge}
                    />
                  </Td>
                  <Td hidden={!show("demoday_1")}>
                    <div className="space-y-1">
                      <TextEditCell
                        id={r.id}
                        field="demoday_1_a"
                        value={r.demoday_1_a}
                        render={(v) =>
                          v ? (
                            <span className="text-[11px] text-zinc-700 whitespace-pre-line">{v}</span>
                          ) : (
                            <span className="text-zinc-300">-</span>
                          )
                        }
                      />
                      <TextEditCell
                        id={r.id}
                        field="demoday_1_b"
                        value={r.demoday_1_b}
                        render={(v) =>
                          v ? (
                            <span className="text-[11px] text-zinc-700 whitespace-pre-line">{v}</span>
                          ) : (
                            <span className="text-[11px] text-zinc-300">-</span>
                          )
                        }
                      />
                    </div>
                  </Td>
                  <Td hidden={!show("demoday_2")}>
                    <div className="space-y-1">
                      <TextEditCell
                        id={r.id}
                        field="demoday_2_a"
                        value={r.demoday_2_a}
                        render={(v) =>
                          v ? (
                            <span className="text-[11px] text-zinc-700 whitespace-pre-line">{v}</span>
                          ) : (
                            <span className="text-zinc-300">-</span>
                          )
                        }
                      />
                      <TextEditCell
                        id={r.id}
                        field="demoday_2_b"
                        value={r.demoday_2_b}
                        render={(v) =>
                          v ? (
                            <span className="text-[11px] text-zinc-700 whitespace-pre-line">{v}</span>
                          ) : (
                            <span className="text-[11px] text-zinc-300">-</span>
                          )
                        }
                      />
                    </div>
                  </Td>
                  <Td hidden={!show("offline")}>
                    <TextEditCell
                      id={r.id}
                      field="offline"
                      value={r.offline}
                      render={statusBadge}
                    />
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={() => setDetailRow(r)}
                      className="inline-flex items-center gap-1 p-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                      title="상세 편집"
                      aria-label="상세 편집"
                    >
                      <PanelRightOpen className="w-3.5 h-3.5" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-zinc-400">필터 결과가 없습니다.</div>
          ) : null}
        </div>
      </div>

      {detailRow ? (
        <PaidCustomerDetailPanel row={detailRow} onClose={() => setDetailRow(null)} />
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────
// Small pieces
// ─────────────────────────────────────────────
function Th({ children, w }: { children: React.ReactNode; w?: string }) {
  return <th className={`text-left px-3 py-2.5 font-medium ${w ?? ""}`}>{children}</th>;
}
function Td({
  children,
  className,
  hidden,
}: {
  children: React.ReactNode;
  className?: string;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return <td className={`px-3 py-2.5 align-top ${className ?? ""}`}>{children}</td>;
}

function PipelineBadge({ company }: { company: PaidCustomer["company"] }) {
  if (!company) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10.5px] font-medium">
        미등록
      </span>
    );
  }
  const stage = company.sales_stage as SalesStageKey | null;
  if (!stage || !SALES_STAGE_LABELS[stage]) {
    return <span className="text-[11px] text-zinc-500">등록됨</span>;
  }
  const c = SALES_STAGE_COLORS[stage];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium ${c.badge}`}
    >
      <span className={`w-1 h-1 rounded-full ${c.dot}`} />
      {SALES_STAGE_LABELS[stage]}
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

function ColumnPicker({
  visibleCols,
  toggleCol,
  onAll,
  onDefault,
}: {
  visibleCols: Set<ColKey>;
  toggleCol: (k: ColKey) => void;
  onAll: () => void;
  onDefault: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 text-zinc-700 text-[12px] font-medium hover:bg-zinc-50 transition-colors shrink-0"
        title="표시할 컬럼 선택"
      >
        <Columns3 className="w-3.5 h-3.5" />
        컬럼 {visibleCols.size}/{COLUMNS.length}
      </button>
      {open ? (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-zinc-200 rounded-lg shadow-lg py-1.5 w-56">
          <div className="text-[10px] uppercase text-zinc-400 px-3 py-1.5">표시할 컬럼</div>
          <div className="max-h-80 overflow-y-auto">
            {COLUMNS.map((c) => {
              const active = visibleCols.has(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleCol(c.key)}
                  disabled={c.locked}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-left hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      active
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : "bg-white border-zinc-300"
                    }`}
                  >
                    {active ? <CheckIcon className="w-3 h-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="flex-1 text-zinc-700">{c.label}</span>
                  {c.locked ? (
                    <span className="text-[9.5px] text-zinc-400">필수</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-zinc-100 mt-1 px-2 py-1 flex gap-1">
            <button
              type="button"
              onClick={onAll}
              className="flex-1 text-[11px] text-zinc-600 hover:bg-zinc-100 rounded px-2 py-1"
            >
              모두 선택
            </button>
            <button
              type="button"
              onClick={onDefault}
              className="flex-1 text-[11px] text-zinc-600 hover:bg-zinc-100 rounded px-2 py-1"
            >
              기본값
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
