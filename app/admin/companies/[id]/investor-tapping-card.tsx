"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coins, ArrowRight } from "lucide-react";
import { updateTappingField, type TappingField } from "../../deals/tapping-actions";

type Props = {
  companyId: number;
  tapping: {
    id: string;
    personal_fund_eligible: string | null;
    lips_eligible: string | null;
    tips_eligible: string | null;
    progress_status: string | null;
    confirmed_operator: string | null;
    pm: string | null;
  } | null;
  events: {
    id: string;
    sequence: number;
    operator: string;
    status: string;
    contact_date: string | null;
    notes: string | null;
  }[];
};

const STATUS_LABEL: Record<string, string> = {
  contacted: "컨택",
  meeting: "미팅",
  reviewing: "검토",
  interested: "관심",
  committed: "확약",
  passed: "드랍",
  hold: "보류",
};

const STATUS_STYLE: Record<string, string> = {
  contacted: "bg-slate-100 text-slate-700",
  meeting: "bg-blue-100 text-blue-700",
  reviewing: "bg-violet-100 text-violet-700",
  interested: "bg-amber-100 text-amber-700",
  committed: "bg-emerald-100 text-emerald-700",
  passed: "bg-rose-100 text-rose-700",
  hold: "bg-stone-100 text-stone-700",
};

export function InvestorTappingCard({ companyId, tapping, events }: Props) {
  // 투자사별 그룹
  const byOperator = new Map<string, typeof events>();
  for (const e of events) {
    const arr = byOperator.get(e.operator) ?? [];
    arr.push(e);
    byOperator.set(e.operator, arr);
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-brand" />
          투자사 태핑
          <span className="text-[10.5px] text-zinc-400 font-normal">
            · 투자사 {byOperator.size}곳 · {events.length}건
          </span>
        </h3>
        <Link
          href="/admin/deals?view=tapping&mode=kanban"
          className="text-[11px] text-brand hover:underline inline-flex items-center gap-0.5"
        >
          투자 딜 보드 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 자격 뱃지 (클릭 → 드롭다운 수정) */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4 pb-3 border-b border-zinc-100">
        <EligibleToggle
          tappingId={tapping?.id ?? null}
          companyId={companyId}
          field="lips_eligible"
          label="LIPS"
          value={tapping?.lips_eligible ?? null}
        />
        <EligibleToggle
          tappingId={tapping?.id ?? null}
          companyId={companyId}
          field="tips_eligible"
          label="TIPS"
          value={tapping?.tips_eligible ?? null}
        />
        <EligibleToggle
          tappingId={tapping?.id ?? null}
          companyId={companyId}
          field="personal_fund_eligible"
          label="개투조합"
          value={tapping?.personal_fund_eligible ?? null}
        />
        {tapping?.confirmed_operator ? (
          <span className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-semibold">
            ✓ 운영사 확정 · {tapping.confirmed_operator}
          </span>
        ) : null}
        {tapping?.progress_status ? (
          <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
            {tapping.progress_status}
          </span>
        ) : null}
      </div>

      {/* 투자사별 태핑 이벤트 */}
      {byOperator.size === 0 ? (
        <div className="text-[12px] text-zinc-400 py-4 text-center">
          아직 투자사 태핑 이력이 없습니다.
          <br />
          <Link href="/admin/deals?view=tapping&mode=kanban" className="text-brand hover:underline">
            투자 딜 보드에서 첫 태핑 추가 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from(byOperator.entries()).map(([operator, opEvents]) => {
            const last = opEvents[opEvents.length - 1];
            const style = STATUS_STYLE[last.status] ?? "bg-zinc-100 text-zinc-700";
            const label = STATUS_LABEL[last.status] ?? last.status;
            return (
              <div
                key={operator}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50/60 border border-zinc-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold ${style}`}>
                      {label}
                    </span>
                    <span className="text-[13px] font-medium text-zinc-900 truncate">
                      {operator}
                    </span>
                    {opEvents.length > 1 ? (
                      <span className="text-[10.5px] text-zinc-400 font-mono">·{opEvents.length}회</span>
                    ) : null}
                    {last.contact_date ? (
                      <span className="text-[10.5px] text-zinc-400 tabular-nums ml-auto">
                        {last.contact_date}
                      </span>
                    ) : null}
                  </div>
                  {last.notes ? (
                    <div className="text-[11.5px] text-zinc-600 line-clamp-2">
                      {last.notes}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** 뱃지 클릭 → 드롭다운. 저장 시 investor_tappings UPDATE */
function EligibleToggle({
  tappingId,
  companyId,
  field,
  label,
  value: initialValue,
}: {
  tappingId: string | null;
  companyId: number;
  field: TappingField;
  label: string;
  value: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [pending, start] = useTransition();

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  const change = (next: string) => {
    if (!tappingId) {
      alert("투자사 태핑 레코드가 없습니다. 투자 딜 보드에서 먼저 추가해주세요.");
      return;
    }
    if (next === value) return;
    start(async () => {
      const res = await updateTappingField(tappingId, field, next);
      if (res.error) {
        alert(`저장 실패: ${res.error}`);
        return;
      }
      setValue(next);
      router.refresh();
    });
  };

  const cls =
    value === "여"
      ? "bg-emerald-100 text-emerald-700"
      : value === "부"
      ? "bg-rose-100 text-rose-700"
      : value === "대기중"
      ? "bg-amber-100 text-amber-700"
      : "bg-zinc-100 text-zinc-400";

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={pending || !tappingId}
        title={!tappingId ? "투자 딜 보드에서 먼저 추가해주세요" : `${label} 자격 변경`}
        className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded appearance-none cursor-pointer ${cls} ${pending ? "opacity-60" : ""}`}
      >
        <option value="">{label} 미입력</option>
        <option value="여">{label} 여</option>
        <option value="부">{label} 부</option>
        <option value="대기중">{label} 대기중</option>
      </select>
    </div>
  );
}
