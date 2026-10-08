import React from "react";

/**
 * 통계 타일 공통 컴포넌트.
 * KPI/MiniStat/SummaryStat/Stat 4개 함수 통합.
 *
 * tone 으로 색 선택 (semantic) — inline hex 대신 Tailwind 토큰 사용.
 * 다크모드 자동 대응.
 */
export type StatTone = "default" | "brand" | "violet" | "emerald" | "amber" | "rose" | "blue";

const TONE_CLS: Record<StatTone, string> = {
  default: "text-zinc-900",
  brand: "text-brand",
  violet: "text-violet-600",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
  blue: "text-blue-600",
};

type Props = {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: StatTone;
  trend?: string;              // 추가 설명 (예: '전주 대비 +12%')
  size?: "sm" | "md" | "lg";   // sm: 미니(KPI 작은 거), md: 기본, lg: 대형 (대시보드)
  icon?: React.ReactNode;      // 선택 아이콘 (좌측)
};

export function StatTile({
  label,
  value,
  suffix,
  tone = "default",
  trend,
  size = "md",
  icon,
}: Props) {
  const sizeCfg = {
    sm: { padding: "px-3 py-2.5", valueCls: "text-[18px]", labelCls: "text-[10px]", trendCls: "text-[10.5px]" },
    md: { padding: "px-4 py-3", valueCls: "text-[22px]", labelCls: "text-[10.5px]", trendCls: "text-[11px]" },
    lg: { padding: "px-5 py-4", valueCls: "text-[26px]", labelCls: "text-[11px]", trendCls: "text-[11.5px]" },
  }[size];

  const valueColorCls = TONE_CLS[tone];

  return (
    <div className={`bg-white border border-zinc-200 rounded-xl ${sizeCfg.padding}`}>
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className={`${sizeCfg.labelCls} font-medium text-zinc-500 uppercase tracking-wide`}>
          {label}
        </div>
        {icon ? <div className="shrink-0 text-zinc-400">{icon}</div> : null}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`${sizeCfg.valueCls} font-bold tabular-nums leading-none ${valueColorCls}`}>
          {value}
        </span>
        {suffix ? <span className="text-[11.5px] text-zinc-500">{suffix}</span> : null}
      </div>
      {trend ? (
        <div className={`${sizeCfg.trendCls} text-zinc-500 mt-1.5`}>{trend}</div>
      ) : null}
    </div>
  );
}
