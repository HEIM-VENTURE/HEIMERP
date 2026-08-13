"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, LinkIcon, PanelRightOpen } from "lucide-react";
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
type ProgramFilter = "all" | "팁스" | "립스" | "투자";
type PipelineFilter = "all" | "linked" | "unlinked";

export function PaidCustomerTable({ rows }: { rows: PaidCustomer[] }) {
  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [paid, setPaid] = useState<PaidFilter>("all");
  const [program, setProgram] = useState<ProgramFilter>("all");
  const [pipeline, setPipeline] = useState<PipelineFilter>("all");
  const [q, setQ] = useState("");
  const [detailRow, setDetailRow] = useState<PaidCustomer | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (urgency !== "all" && r.urgency !== urgency) return false;
      if (paid === "paid" && r.is_paid !== true) return false;
      if (paid === "unpaid" && r.is_paid !== false) return false;
      if (program !== "all" && !(r.target_program ?? "").includes(program)) return false;
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
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="회사명 / 법인명 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-200 text-[13px] w-64 focus:outline-none focus:border-brand"
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
            { key: "립스", label: "립스" },
            { key: "투자", label: "투자" },
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
        <span className="ml-auto text-[12px] text-zinc-500">
          {filtered.length} / {rows.length}건
        </span>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-white text-[12px] font-medium hover:bg-zinc-800 transition-colors"
          title="현재 필터된 목록을 엑셀 파일로 다운로드"
        >
          <Download className="w-3.5 h-3.5" />
          엑셀 다운로드
        </button>
      </div>

      {/* 표 — 컨테이너 자체가 x/y 스크롤. thead가 이 컨테이너 상단에 sticky */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-auto max-h-[calc(100vh-14rem)]">
        <div>
          <table className="w-full text-[12.5px]">
            <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(228_228_231)]">
              <tr>
                <Th w="w-10">#</Th>
                <Th w="w-56">회사명 · 법인명</Th>
                <Th w="w-24">파이프라인</Th>
                <Th w="w-16">결제</Th>
                <Th w="w-14">긴급</Th>
                <Th w="w-14">팁스</Th>
                <Th w="w-14">립스</Th>
                <Th w="w-14">투자</Th>
                <Th w="w-28">설립일</Th>
                <Th w="w-24">인원</Th>
                <Th w="w-24">신규법인</Th>
                <Th w="w-20">IR팁스</Th>
                <Th w="w-20">IR립스</Th>
                <Th w="w-28">1차 데모데이</Th>
                <Th w="w-28">2차 데모데이</Th>
                <Th w="w-20">오프라인</Th>
                <Th w="w-10">{" "}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/40 transition-colors align-top">
                  <Td>
                    <span className="tabular-nums text-zinc-400">{r.no ?? "-"}</span>
                  </Td>
                  <Td>
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
                  <Td>
                    <PipelineBadge company={r.company} />
                  </Td>
                  <Td>
                    <PaidToggleCell id={r.id} value={r.is_paid} />
                  </Td>
                  <Td>
                    <UrgencySelectCell id={r.id} value={r.urgency} />
                  </Td>
                  <Td>
                    <ProgramCheckCell id={r.id} kind="팁스" value={r.target_program} />
                  </Td>
                  <Td>
                    <ProgramCheckCell id={r.id} kind="립스" value={r.target_program} />
                  </Td>
                  <Td>
                    <ProgramCheckCell id={r.id} kind="투자" value={r.target_program} />
                  </Td>
                  <Td>
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
                  <Td>
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
                  <Td>
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
                  <Td>
                    <TextEditCell
                      id={r.id}
                      field="ir_deck_tips"
                      value={r.ir_deck_tips}
                      placeholder="O · 1주후"
                      render={statusBadge}
                    />
                  </Td>
                  <Td>
                    <TextEditCell
                      id={r.id}
                      field="ir_deck_lips"
                      value={r.ir_deck_lips}
                      placeholder="O · 2주후"
                      render={statusBadge}
                    />
                  </Td>
                  <Td>
                    <TextEditCell
                      id={r.id}
                      field="demoday_1_a"
                      value={r.demoday_1_a}
                      render={(v) =>
                        v ? (
                          <span className="text-[11px] text-zinc-600">{v}</span>
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
                          <span className="text-[10.5px] text-zinc-400">{v}</span>
                        ) : (
                          <span className="text-[10.5px] text-zinc-300">-</span>
                        )
                      }
                    />
                  </Td>
                  <Td>
                    <TextEditCell
                      id={r.id}
                      field="demoday_2_a"
                      value={r.demoday_2_a}
                      render={(v) =>
                        v ? (
                          <span className="text-[11px] text-zinc-600">{v}</span>
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
                          <span className="text-[10.5px] text-zinc-400">{v}</span>
                        ) : (
                          <span className="text-[10.5px] text-zinc-300">-</span>
                        )
                      }
                    />
                  </Td>
                  <Td>
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
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
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
