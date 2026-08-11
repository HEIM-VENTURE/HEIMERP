"use client";

import { useMemo, useState } from "react";
import { Check, X, HelpCircle } from "lucide-react";

type PaidCustomer = {
  id: string;
  no: number | null;
  company_name: string;
  is_paid: boolean | null;
  new_corp_setup: string | null;
  new_company_name: string | null;
  target_program: string | null;
  urgency: number | null;
  legal_name: string | null;
  established_at: string | null;
  headcount: string | null;
  ir_deck_tips: string | null;
  ir_deck_lips: string | null;
  demoday_1_a: string | null;
  demoday_1_b: string | null;
  demoday_2_a: string | null;
  demoday_2_b: string | null;
  offline: string | null;
};

type UrgencyFilter = "all" | 1 | 2 | 3;
type PaidFilter = "all" | "paid" | "unpaid";
type ProgramFilter = "all" | "팁스" | "립스" | "투자";

export function PaidCustomerTable({ rows }: { rows: PaidCustomer[] }) {
  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [paid, setPaid] = useState<PaidFilter>("all");
  const [program, setProgram] = useState<ProgramFilter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (urgency !== "all" && r.urgency !== urgency) return false;
      if (paid === "paid" && r.is_paid !== true) return false;
      if (paid === "unpaid" && r.is_paid !== false) return false;
      if (program !== "all" && !(r.target_program ?? "").includes(program)) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = [r.company_name, r.legal_name, r.new_company_name].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, urgency, paid, program, q]);

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
        <span className="ml-auto text-[12px] text-zinc-500">
          {filtered.length} / {rows.length}건
        </span>
      </div>

      {/* 표 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="text-[11px] text-zinc-500 bg-zinc-50/80 border-b border-zinc-200">
              <tr>
                <Th w="w-10">#</Th>
                <Th w="w-52">회사명 · 법인명</Th>
                <Th w="w-16">결제</Th>
                <Th w="w-14">긴급</Th>
                <Th w="w-32">타깃</Th>
                <Th w="w-24">설립일</Th>
                <Th w="w-20">인원</Th>
                <Th w="w-20">신규법인</Th>
                <Th w="w-20">IR팁스</Th>
                <Th w="w-20">IR립스</Th>
                <Th w="w-32">1차 데모데이</Th>
                <Th w="w-32">2차 데모데이</Th>
                <Th w="w-20">오프라인</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/70 transition-colors">
                  <Td>
                    <span className="tabular-nums text-zinc-400">{r.no ?? "-"}</span>
                  </Td>
                  <Td>
                    <div className="font-medium text-zinc-900 truncate">{r.company_name}</div>
                    {r.legal_name && r.legal_name !== r.company_name ? (
                      <div className="text-[10.5px] text-zinc-400 truncate">{r.legal_name}</div>
                    ) : null}
                    {r.new_company_name ? (
                      <div className="text-[10.5px] text-brand mt-0.5">신규: {r.new_company_name}</div>
                    ) : null}
                  </Td>
                  <Td><PaidBadge value={r.is_paid} /></Td>
                  <Td><UrgencyBadge value={r.urgency} /></Td>
                  <Td>{splitProgram(r.target_program)}</Td>
                  <Td className="text-[11px] text-zinc-600 tabular-nums">{r.established_at ?? "-"}</Td>
                  <Td className="text-[11px] text-zinc-600">{r.headcount ?? "-"}</Td>
                  <Td>{r.new_corp_setup ? <span className="text-[11px] text-zinc-700">{r.new_corp_setup}</span> : "-"}</Td>
                  <Td>{stateCell(r.ir_deck_tips)}</Td>
                  <Td>{stateCell(r.ir_deck_lips)}</Td>
                  <Td className="text-[11px] text-zinc-600">
                    {r.demoday_1_a || "-"}
                    {r.demoday_1_b ? <div className="text-[10.5px] text-zinc-400">{r.demoday_1_b}</div> : null}
                  </Td>
                  <Td className="text-[11px] text-zinc-600">
                    {r.demoday_2_a || "-"}
                    {r.demoday_2_b ? <div className="text-[10.5px] text-zinc-400">{r.demoday_2_b}</div> : null}
                  </Td>
                  <Td>{stateCell(r.offline)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-zinc-400">필터 결과가 없습니다.</div>
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

function PaidBadge({ value }: { value: boolean | null }) {
  if (value === true)
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-medium">
        <Check className="w-2.5 h-2.5" /> 결제
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10.5px] font-medium">
        <X className="w-2.5 h-2.5" /> 미결제
      </span>
    );
  return <span className="text-zinc-300">-</span>;
}

function UrgencyBadge({ value }: { value: number | null }) {
  if (!value) return <span className="text-zinc-300">-</span>;
  const styles: Record<number, string> = {
    1: "bg-rose-50 text-rose-700",
    2: "bg-amber-50 text-amber-700",
    3: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-semibold tabular-nums ${styles[value] ?? "bg-zinc-100 text-zinc-600"}`}>
      {value}
    </span>
  );
}

function splitProgram(prog: string | null) {
  if (!prog) return <span className="text-zinc-300">-</span>;
  const parts = prog.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-0.5">
      {parts.map((p) => (
        <span key={p} className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10.5px]">
          {p}
        </span>
      ))}
    </div>
  );
}

function stateCell(val: string | null) {
  if (!val) return <span className="text-zinc-300">-</span>;
  if (val === "O")
    return (
      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-medium">
        <Check className="w-2.5 h-2.5" />
      </span>
    );
  if (val === "?")
    return (
      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[10.5px]">
        <HelpCircle className="w-2.5 h-2.5" />
      </span>
    );
  return <span className="text-[11px] text-zinc-700">{val}</span>;
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
