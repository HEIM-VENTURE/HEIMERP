import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  Building2,
  Calendar,
  User,
  Target,
  TrendingUp,
  Sparkles,
  Users,
} from "lucide-react";
import {
  findDealById,
  ROUND_LABEL,
  DEAL_STAGE_LABEL,
  DEAL_STAGE_COLOR,
  INVESTOR_TYPE_LABEL,
  INVESTOR_STATUS_LABEL,
  INVESTOR_STATUS_COLOR,
} from "@/lib/mock-deals";

export const metadata = { title: "투자 딜 상세 · HEIM ERP" };

type Props = { params: Promise<{ id: string }> };

const STAGE_FLOW = [
  "prep",
  "tapping",
  "meeting",
  "term_sheet",
  "ic",
  "closing",
  "closed",
] as const;

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;
  const d = findDealById(id);
  if (!d) return notFound();

  const stageC = DEAL_STAGE_COLOR[d.stage];
  const stageIdx = STAGE_FLOW.indexOf(d.stage as any);

  const committedAmount = d.investors
    .filter((i) => i.status === "committed" || i.status === "term_sheet")
    .reduce((s, i) => s + (i.proposed_amount ?? 0), 0);
  const interestedAmount = d.investors
    .filter((i) => i.status === "interested" || i.status === "meeting")
    .reduce((s, i) => s + (i.proposed_amount ?? 0), 0);
  const commitPct = Math.min(100, Math.round((committedAmount / d.target_amount) * 100));

  // Investor breakdown by status (for pipeline visual)
  const statusOrder = [
    "target",
    "contacted",
    "meeting",
    "interested",
    "term_sheet",
    "committed",
    "passed",
  ] as const;
  const statusBreakdown = statusOrder.map((s) => ({
    status: s,
    count: d.investors.filter((i) => i.status === s).length,
  }));

  return (
    <>
      <Link
        href="/admin/deals"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        투자 딜
      </Link>

      {/* Hero */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Coins className="w-8 h-8" />
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
              <span className="text-[11px] text-zinc-500 font-mono ml-1">{d.code}</span>
            </div>
            <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight mb-1">
              {d.company_name} · {ROUND_LABEL[d.round]}
            </h1>
            <div className="text-[13px] text-zinc-600">
              <Link
                href={`/admin/projects/${d.project_id}`}
                className="hover:text-brand hover:underline inline-flex items-center gap-1"
              >
                <Building2 className="w-3 h-3" />
                {d.project_name}
              </Link>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
              {d.stage === "closed" ? "확정 유치" : "목표 유치"}
            </div>
            <div className="text-[28px] font-bold text-zinc-900 tabular-nums leading-none">
              {d.stage === "closed" ? `${d.actual_amount}억` : `${d.target_amount}억`}
            </div>
            {d.min_amount && d.stage !== "closed" ? (
              <div className="text-[11px] text-zinc-500 mt-1">최소 {d.min_amount}억</div>
            ) : null}
          </div>
        </div>

        {/* Commit progress */}
        {d.stage !== "closed" && d.stage !== "lost" ? (
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[12px] text-zinc-600">
                커밋·텀시트 <b className="text-zinc-900 tabular-nums">{committedAmount}억</b>
                <span className="text-zinc-400 mx-1.5">·</span>
                미팅·관심{" "}
                <b className="text-zinc-900 tabular-nums">{interestedAmount}억</b>
              </span>
              <span className="text-[12.5px] font-bold text-zinc-900 tabular-nums">
                {commitPct}% 확보
              </span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden relative">
              <div
                className="h-full absolute left-0 top-0"
                style={{
                  width: `${Math.min(100, ((committedAmount + interestedAmount) / d.target_amount) * 100)}%`,
                  background: "#EDE9FE",
                }}
              />
              <div
                className="h-full absolute left-0 top-0 rounded-full"
                style={{
                  width: `${commitPct}%`,
                  background: "linear-gradient(90deg, #8B5CF6, #EC4899)",
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-2 mt-5">
          <QuickStat icon={<TrendingUp />} label="Pre-val" value={d.pre_valuation ? `${d.pre_valuation}억` : "—"} />
          <QuickStat icon={<Users />} label="리드" value={d.lead_investor ?? "미확정"} />
          <QuickStat icon={<User />} label="PM" value={d.pm} />
          <QuickStat icon={<Calendar />} label="시작" value={d.opened_at} />
          <QuickStat
            icon={<Target />}
            label={d.stage === "closed" ? "클로징" : "목표 마감"}
            value={d.closed_at ?? d.target_close ?? "—"}
          />
        </div>
      </div>

      {/* Deal stage timeline */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-zinc-900">딜 진행 단계</h2>
          <span className="text-[11.5px] text-zinc-500">
            {stageIdx >= 0 ? `${stageIdx + 1}/${STAGE_FLOW.length}` : "실패"} 단계
          </span>
        </div>
        <div className="relative">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-zinc-100" />
          <div
            className="absolute top-3 left-0 h-0.5 rounded-full"
            style={{
              width: stageIdx >= 0 ? `${((stageIdx + 1) / STAGE_FLOW.length) * 100}%` : "0%",
              background: "linear-gradient(90deg, #8B5CF6, #EC4899)",
            }}
          />
          <div className="relative grid grid-cols-7">
            {STAGE_FLOW.map((s, i) => {
              const done = i < stageIdx;
              const current = i === stageIdx;
              return (
                <div key={s} className="flex flex-col items-center text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                      done
                        ? "bg-purple-500"
                        : current
                        ? "ring-4 ring-purple-100 bg-pink-500"
                        : "bg-white border-2 border-zinc-200"
                    }`}
                  >
                    {done ? "✓" : current ? "●" : ""}
                  </div>
                  <div
                    className={`text-[10.5px] mt-2 leading-tight ${
                      current ? "text-zinc-900 font-semibold" : done ? "text-zinc-700" : "text-zinc-400"
                    }`}
                  >
                    {DEAL_STAGE_LABEL[s]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Investor pipeline breakdown */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-5">
        <h3 className="text-[14px] font-semibold text-zinc-900 mb-4">
          투자자 파이프라인
        </h3>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {statusBreakdown.map((s) => {
            const c = INVESTOR_STATUS_COLOR[s.status];
            return (
              <div key={s.status} className="text-center">
                <div
                  className="rounded-lg py-3"
                  style={{ background: s.count > 0 ? c.bg : "#F9FAFB" }}
                >
                  <div
                    className="text-[20px] font-bold tabular-nums"
                    style={{ color: s.count > 0 ? c.text : "#D1D5DB" }}
                  >
                    {s.count}
                  </div>
                </div>
                <div className="text-[10.5px] text-zinc-500 mt-1.5 font-medium">
                  {INVESTOR_STATUS_LABEL[s.status]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Investor list */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-zinc-900">
            투자자 {d.investors.length}곳
          </h3>
          <button className="text-[12px] text-brand hover:underline" title="Mock">
            + 투자자 추가
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-[11px] text-zinc-500 bg-zinc-50/60 border-b border-zinc-100">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium">투자자</th>
              <th className="text-left px-5 py-2.5 font-medium w-24">타입</th>
              <th className="text-left px-5 py-2.5 font-medium w-40">담당자</th>
              <th className="text-left px-5 py-2.5 font-medium w-24">상태</th>
              <th className="text-right px-5 py-2.5 font-medium w-24">제안액</th>
              <th className="text-left px-5 py-2.5 font-medium w-28">최근 접촉</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {d.investors.map((inv) => {
              const c = INVESTOR_STATUS_COLOR[inv.status];
              return (
                <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-[13.5px] font-medium text-zinc-900">{inv.name}</div>
                    {inv.note ? (
                      <div className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-[280px]" title={inv.note}>
                        {inv.note}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-zinc-600">
                    {INVESTOR_TYPE_LABEL[inv.type]}
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-zinc-700">
                    {inv.contact_person ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ background: c.bg, color: c.text }}
                    >
                      {INVESTOR_STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[13px] text-zinc-900 font-medium tabular-nums">
                    {inv.proposed_amount ? `${inv.proposed_amount}억` : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-[11.5px] text-zinc-500 tabular-nums">
                    {inv.last_touch ?? <span className="text-zinc-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes + IC placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {d.notes ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <h3 className="text-[14px] font-semibold text-zinc-900 mb-3">노트</h3>
            <p className="text-[13.5px] text-zinc-700 leading-relaxed whitespace-pre-line">
              {d.notes}
            </p>
          </div>
        ) : (
          <div />
        )}

        <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <h3 className="text-[13px] font-semibold text-zinc-500">투자심의 · 클로징</h3>
            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium tracking-wider uppercase">
              soon
            </span>
          </div>
          <div className="text-[12px] text-zinc-500 mb-2">
            심의위원회 회수: <b className="text-zinc-900">{d.ic_count}회</b>
          </div>
          <p className="text-[11.5px] text-zinc-400 leading-relaxed">
            IC 팩터·심의 결과·최종 클로징 문서 관리 UI는 다음 단계에서 구축 예정.
          </p>
        </div>
      </div>
    </>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 font-medium">
        <span className="text-zinc-400 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>
        {label}
      </div>
      <div className="text-[13.5px] text-zinc-900 font-semibold tabular-nums mt-0.5 truncate">
        {value}
      </div>
    </div>
  );
}
