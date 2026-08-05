import Link from "next/link";
import { Coins, TrendingUp, Sparkles } from "lucide-react";
import {
  MOCK_DEALS,
  DEAL_STAGE_LABEL,
  DEAL_STAGE_COLOR,
  ROUND_LABEL,
  type DealStage,
} from "@/lib/mock-deals";

export const metadata = { title: "투자 딜 · HEIM ERP" };

const TABS: { key: DealStage | "all" | "active"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "active", label: "진행 중" },
  { key: "prep", label: "준비" },
  { key: "tapping", label: "태핑" },
  { key: "meeting", label: "미팅" },
  { key: "term_sheet", label: "텀시트" },
  { key: "ic", label: "투심위" },
  { key: "closing", label: "클로징" },
  { key: "closed", label: "완료" },
  { key: "lost", label: "실패" },
];

const ACTIVE_STAGES: DealStage[] = ["tapping", "meeting", "term_sheet", "ic", "closing"];

type Props = {
  searchParams: Promise<{ stage?: string }>;
};

export default async function DealsListPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeTab = (params.stage ?? "all") as DealStage | "all" | "active";

  const rows =
    activeTab === "all"
      ? MOCK_DEALS
      : activeTab === "active"
      ? MOCK_DEALS.filter((d) => ACTIVE_STAGES.includes(d.stage))
      : MOCK_DEALS.filter((d) => d.stage === activeTab);

  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    if (t.key === "all") acc[t.key] = MOCK_DEALS.length;
    else if (t.key === "active")
      acc[t.key] = MOCK_DEALS.filter((d) => ACTIVE_STAGES.includes(d.stage)).length;
    else acc[t.key] = MOCK_DEALS.filter((d) => d.stage === t.key).length;
    return acc;
  }, {});

  const activeDeals = MOCK_DEALS.filter((d) => ACTIVE_STAGES.includes(d.stage));
  const totalTargetActive = activeDeals.reduce((s, d) => s + d.target_amount, 0);
  const closedDeals = MOCK_DEALS.filter((d) => d.stage === "closed");
  const totalClosed = closedDeals.reduce((s, d) => s + (d.actual_amount ?? 0), 0);

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">투자 딜</h1>
          <p className="text-sm text-zinc-500 mt-1">
            프로젝트별 투자 라운드 · 투자자 태핑 · 텀시트 · 심의 · 클로징 관리.
          </p>
        </div>
        <div className="text-xs text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Mock 데이터
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <SummaryStat label="전체 딜" value={MOCK_DEALS.length} suffix="건" />
        <SummaryStat label="진행 중" value={activeDeals.length} suffix="건" tint="#8B5CF6" />
        <SummaryStat
          label="목표 유치액 (진행)"
          value={totalTargetActive}
          suffix="억"
          tint="#EC4899"
        />
        <SummaryStat
          label="확정 유치액 (누계)"
          value={totalClosed}
          suffix="억"
          tint="#10B981"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-zinc-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/deals" : `/admin/deals?stage=${t.key}`}
              className={`px-3.5 py-2.5 text-[13px] rounded-t-md transition-colors -mb-px border-b-2 whitespace-nowrap ${
                active
                  ? "border-brand text-zinc-900 font-medium"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[11px] text-zinc-400">{counts[t.key]}</span>
            </Link>
          );
        })}
      </div>

      {/* Deal cards */}
      {rows.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl py-12 text-center text-sm text-zinc-400">
          해당 단계의 딜이 없습니다
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((d) => {
            const stageC = DEAL_STAGE_COLOR[d.stage];
            const committedAmount = d.investors
              .filter((i) => i.status === "committed" || i.status === "term_sheet")
              .reduce((s, i) => s + (i.proposed_amount ?? 0), 0);
            const commitPct = Math.min(
              100,
              Math.round((committedAmount / d.target_amount) * 100)
            );
            return (
              <Link
                key={d.id}
                href={`/admin/deals/${d.id}`}
                className="block bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all"
              >
                <div className="flex items-start gap-5">
                  {/* Left: Round icon + info */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Coins className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full"
                        style={{ background: stageC.bg, color: stageC.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: stageC.dot }} />
                        {DEAL_STAGE_LABEL[d.stage]}
                      </span>
                      <span className="text-[11.5px] font-semibold text-zinc-700 px-2 py-0.5 bg-zinc-100 rounded-full">
                        {ROUND_LABEL[d.round]}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono ml-1">{d.code}</span>
                    </div>
                    <h3 className="text-[15.5px] font-semibold text-zinc-900 mb-0.5">
                      {d.company_name}
                    </h3>
                    <div className="text-[12px] text-zinc-500">{d.project_name}</div>
                  </div>

                  {/* Right: Amount + progress */}
                  <div className="text-right shrink-0 min-w-[140px]">
                    <div className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      {d.stage === "closed" ? "확정" : "목표"}
                    </div>
                    <div className="text-[22px] font-bold text-zinc-900 tabular-nums leading-none">
                      {d.stage === "closed"
                        ? `${d.actual_amount}억`
                        : `${d.target_amount}억`}
                    </div>
                    {d.pre_valuation ? (
                      <div className="text-[11px] text-zinc-500 mt-1">
                        Pre-val {d.pre_valuation}억
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Commitment progress */}
                {d.stage !== "closed" && d.stage !== "lost" ? (
                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[11.5px] text-zinc-600">
                        커밋·텀시트 확보:{" "}
                        <b className="text-zinc-900 tabular-nums">
                          {committedAmount}억 / {d.target_amount}억
                        </b>
                      </span>
                      <span className="text-[11.5px] font-semibold text-zinc-900 tabular-nums">
                        {commitPct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${commitPct}%`,
                          background: "linear-gradient(90deg, #8B5CF6, #EC4899)",
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Bottom meta */}
                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11.5px]">
                  <div className="flex items-center gap-4 text-zinc-500">
                    <span>
                      투자자 <b className="text-zinc-900">{d.investors.length}</b>곳 접촉
                    </span>
                    <span>
                      리드{" "}
                      <b className="text-zinc-900">{d.lead_investor ?? "미확정"}</b>
                    </span>
                    <span>PM {d.pm}</span>
                  </div>
                  {d.next_action && d.stage !== "closed" ? (
                    <div className="flex items-center gap-1.5 text-zinc-600">
                      <TrendingUp className="w-3 h-3 text-zinc-400" />
                      <span className="truncate max-w-[280px]">{d.next_action}</span>
                      {d.next_action_date ? (
                        <span className="text-zinc-400">· {d.next_action_date}</span>
                      ) : null}
                    </div>
                  ) : d.stage === "closed" && d.closed_at ? (
                    <div className="text-zinc-500">클로징 {d.closed_at}</div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
  tint,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tint?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 bg-white border"
      style={{ borderColor: tint ? tint + "33" : "#E4E4E7" }}
    >
      <div className="text-[11.5px] text-zinc-500 font-medium">{label}</div>
      <div className="flex items-baseline gap-1 mt-1.5">
        <span
          className="text-[22px] font-bold tabular-nums leading-none"
          style={{ color: tint ?? "#1F2A36" }}
        >
          {value}
        </span>
        {suffix ? <span className="text-[11px] text-zinc-500">{suffix}</span> : null}
      </div>
    </div>
  );
}
