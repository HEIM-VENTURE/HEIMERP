"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  TappingSummaryCell,
  STATUS_LABEL,
  STATUS_COLOR,
  type TappingEvent,
} from "./tapping-events-panel";
import type { EventStatus } from "./tapping-event-actions";
import { moveTappingStatus } from "./tapping-event-actions";

type CardRow = {
  id: string;
  company_id: number | null;
  company_name_snapshot: string;
  confirmed_operator: string | null;
  lips_eligible: string | null;
  tips_eligible: string | null;
  events: TappingEvent[];
};

type ColumnKey = "none" | EventStatus;

const COLUMNS: { key: ColumnKey; label: string; bg: string; header: string }[] = [
  { key: "none", label: "미시작", bg: "bg-zinc-50", header: "border-zinc-300" },
  { key: "contacted", label: "컨택", bg: "bg-slate-50", header: "border-slate-300" },
  { key: "meeting", label: "미팅", bg: "bg-blue-50/60", header: "border-blue-300" },
  { key: "reviewing", label: "검토", bg: "bg-violet-50/60", header: "border-violet-300" },
  { key: "interested", label: "관심", bg: "bg-amber-50/60", header: "border-amber-300" },
  { key: "committed", label: "확약", bg: "bg-emerald-50/60", header: "border-emerald-400" },
  { key: "passed", label: "거절", bg: "bg-rose-50/50", header: "border-rose-300" },
  { key: "hold", label: "보류", bg: "bg-stone-50", header: "border-stone-300" },
];

function bucketFor(row: CardRow): ColumnKey {
  if (row.events.length === 0) return "none";
  return row.events[row.events.length - 1].status;
}

export function TappingKanban({ rows }: { rows: CardRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, ColumnKey>>({});

  const columns = useMemo(() => {
    const map = new Map<ColumnKey, CardRow[]>();
    COLUMNS.forEach((c) => map.set(c.key, []));
    for (const r of rows) {
      const bucket = optimistic[r.id] ?? bucketFor(r);
      map.get(bucket)!.push(r);
    }
    return map;
  }, [rows, optimistic]);

  const onDrop = (colKey: ColumnKey, cardId: string) => {
    setDragOver(null);
    if (colKey === "none") {
      alert("'미시작' 컬럼으로는 드래그 이동할 수 없습니다. 이벤트를 삭제하려면 카드를 클릭해 편집하세요.");
      return;
    }
    const row = rows.find((r) => r.id === cardId);
    if (!row) return;
    const current = bucketFor(row);
    if (current === colKey) return;

    // 이벤트가 없으면 operator 물어보기
    let fallback: string | undefined;
    if (row.events.length === 0) {
      const v = prompt(`${row.company_name_snapshot} · 첫 태핑 대상 (예: 코맥스벤처러스)`);
      if (!v?.trim()) return;
      fallback = v.trim();
    }

    setOptimistic((o) => ({ ...o, [cardId]: colKey }));
    start(async () => {
      const res = await moveTappingStatus(cardId, colKey, fallback);
      if (res.error) {
        alert(res.error);
        setOptimistic((o) => {
          const next = { ...o };
          delete next[cardId];
          return next;
        });
        return;
      }
      router.refresh();
      // 서버 데이터가 오면 optimistic 지움
      setTimeout(() => {
        setOptimistic((o) => {
          const next = { ...o };
          delete next[cardId];
          return next;
        });
      }, 800);
    });
  };

  return (
    <div className="relative">
      {pending ? (
        <div className="absolute top-0 right-0 z-20 text-[11px] text-zinc-500 bg-white/90 px-2 py-1 rounded shadow-sm">
          저장 중…
        </div>
      ) : null}

      <div className="overflow-x-auto pb-3">
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map((c) => {
            const items = columns.get(c.key) ?? [];
            const isOver = dragOver === c.key;
            return (
              <div
                key={c.key}
                className={`w-[260px] shrink-0 rounded-2xl ${c.bg} border-2 transition-all ${
                  isOver ? c.header : "border-transparent"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(c.key);
                }}
                onDragLeave={() => setDragOver((d) => (d === c.key ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData("text/plain");
                  if (cardId) onDrop(c.key, cardId);
                }}
              >
                <div className={`px-3 pt-3 pb-2 flex items-center justify-between border-b-2 ${c.header}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-zinc-900">{c.label}</span>
                    <span className="text-[11px] tabular-nums text-zinc-500">{items.length}</span>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[80px]">
                  {items.length === 0 ? (
                    <div className="text-[11px] text-zinc-300 text-center py-4">
                      비어 있음
                    </div>
                  ) : (
                    items.map((r) => <KanbanCard key={r.id} row={r} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-[11.5px] text-zinc-500">
        💡 카드를 <b>드래그</b>해서 다른 상태로 옮기면 최근 태핑의 상태가 변경됩니다. 카드 클릭 → 상세 관리.
      </div>
    </div>
  );
}

function KanbanCard({ row }: { row: CardRow }) {
  const last = row.events[row.events.length - 1];
  const c = last ? STATUS_COLOR[last.status] : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", row.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="bg-white rounded-lg border border-zinc-200 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-grab active:cursor-grabbing transition-shadow"
    >
      {/* 기업명 */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        {row.company_id ? (
          <Link
            href={`/admin/companies/${row.company_id}`}
            className="text-[13px] font-semibold text-zinc-900 hover:text-brand hover:underline leading-tight"
            onClick={(e) => e.stopPropagation()}
          >
            {row.company_name_snapshot}
          </Link>
        ) : (
          <span className="text-[13px] font-semibold text-zinc-900 leading-tight">
            {row.company_name_snapshot}
            <span className="ml-1 text-[10px] text-amber-500">⚠</span>
          </span>
        )}
      </div>

      {/* 자격 배지 · 확정 운영사 */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {row.lips_eligible === "여" ? (
          <span className="text-[9.5px] font-semibold px-1.5 py-0 rounded-full bg-blue-100 text-blue-700">
            LIPS
          </span>
        ) : null}
        {row.tips_eligible === "여" ? (
          <span className="text-[9.5px] font-semibold px-1.5 py-0 rounded-full bg-amber-100 text-amber-700">
            TIPS
          </span>
        ) : null}
        {row.confirmed_operator ? (
          <span
            className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold px-1.5 py-0 rounded-full bg-emerald-100 text-emerald-700"
            title={`확정 운영사: ${row.confirmed_operator}`}
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            확정
          </span>
        ) : null}
      </div>

      {/* 태핑 요약 셀 (기존 컴포넌트 재사용 · 클릭 시 사이드패널 열림) */}
      <div onMouseDown={(e) => e.stopPropagation()}>
        <TappingSummaryCell
          tappingId={row.id}
          companyName={row.company_name_snapshot}
          events={row.events}
        />
      </div>

      {/* 최근 접촉일 */}
      {last?.contact_date ? (
        <div className="mt-1 text-[10.5px] text-zinc-400 tabular-nums">
          최근 접촉: {last.contact_date}
        </div>
      ) : null}
    </div>
  );
}
