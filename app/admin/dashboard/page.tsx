import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { NewCompanyModal } from "../pipeline/company-modals";
import {
  SALES_STAGE_LABELS,
  SALES_STAGES_ORDER,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 임박 To-do 기준 (이번 주까지)
  const todayStr0 = new Date().toISOString().split("T")[0];
  const weekLater0 = new Date();
  weekLater0.setDate(weekLater0.getDate() + 7);
  const weekStr0 = weekLater0.toISOString().split("T")[0];

  // ===== 모든 쿼리를 동시에 (Promise.all로 RTT 1번만) =====
  const [companiesRes, hvpsRes, contractsRes, imminentRes, hvpListRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, sales_stage, consulting_stage, received_at, created_at, name, updated_at"),
    supabase.from("hvp").select("id, status"),
    supabase.from("contracts").select("id, total_amount, hvp_fee_amount, payment_status"),
    supabase
      .from("todos")
      .select("id, title, due_date, status, category, companies(id, name)")
      .neq("status", "done")
      .not("due_date", "is", null)
      .lte("due_date", weekStr0)
      .order("due_date", { ascending: true })
      .limit(12),
    supabase.from("hvp").select("id, name, cohort").order("name", { ascending: true }),
  ]);

  const allCompanies = companiesRes.data ?? [];
  const allHvps = hvpsRes.data ?? [];
  const allContracts = contractsRes.data ?? [];
  type ImminentTodo = {
    id: number;
    title: string;
    due_date: string | null;
    category: string | null;
    companies: { id: number; name: string } | null;
  };
  const imminent = (imminentRes.data as unknown as ImminentTodo[]) ?? [];
  const overdueTodos = imminent.filter((t) => t.due_date && t.due_date < todayStr0);
  const todayDue = imminent.filter((t) => t.due_date === todayStr0);
  const weekDue = imminent.filter((t) => t.due_date && t.due_date > todayStr0);
  const hvpList = (hvpListRes.data as { id: string; name: string; cohort: string | null }[]) ?? [];

  const totalCompanies = allCompanies.length;
  const kickoffCount = allCompanies.filter((c) => c.sales_stage === "kickoff").length;
  const tipsSelected = allCompanies.filter(
    (c) => c.consulting_stage === "fund_closing" || c.consulting_stage === "final_closing"
  ).length;
  const activeHvps = allHvps.filter((h) => h.status === "active").length;
  const tipsConversionRate =
    totalCompanies > 0 ? Math.round((tipsSelected / totalCompanies) * 1000) / 10 : 0;

  // 이번 달 신규
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthNewCount = allCompanies.filter(
    (c) => new Date(c.received_at) >= thisMonthStart
  ).length;
  const thisMonthKickoffCount = allCompanies.filter(
    (c) => c.sales_stage === "kickoff" && new Date(c.received_at) >= thisMonthStart
  ).length;

  const kpis = [
    {
      label: "전체 접수 기업",
      value: totalCompanies.toString(),
      delta: thisMonthNewCount > 0 ? `↑ ${thisMonthNewCount} (이번 달)` : "이번 달 신규 없음",
      positive: thisMonthNewCount > 0,
    },
    {
      label: "착수 (컨설팅 진행)",
      value: kickoffCount.toString(),
      delta: thisMonthKickoffCount > 0 ? `↑ ${thisMonthKickoffCount} (이번 달)` : "이번 달 변동 없음",
      positive: thisMonthKickoffCount > 0,
    },
    {
      label: "TIPS 선정",
      value: tipsSelected.toString(),
      delta: `전환율 ${tipsConversionRate}%`,
    },
    {
      label: "활동 HVP",
      value: activeHvps.toString(),
      delta: activeHvps === 0 ? "HVP 등록 필요" : `총 ${allHvps.length}명`,
    },
  ];

  // 단계별 분포
  const stageDist = SALES_STAGES_ORDER.map((s) => ({
    stage: s,
    name: SALES_STAGE_LABELS[s],
    count: allCompanies.filter((c) => c.sales_stage === s).length,
    color: SALES_STAGE_COLORS[s].dot,
  }));
  const maxStageCount = Math.max(...stageDist.map((s) => s.count), 1);

  // 월별 신규 접수 (최근 6개월)
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = allCompanies.filter((c) => {
      const r = new Date(c.received_at);
      return r >= d && r < next;
    }).length;
    return {
      label: `${d.getMonth() + 1}월`,
      year: d.getFullYear(),
      count,
      isCurrent: i === 5,
    };
  });
  const maxMonthly = Math.max(...months.map((m) => m.count), 1);
  const totalRecent = months.reduce((a, m) => a + m.count, 0);
  const avgMonthly = months.length > 0 ? (totalRecent / months.length).toFixed(1) : "0";
  const lastMonth = months[months.length - 2]?.count ?? 0;
  const currMonth = months[months.length - 1]?.count ?? 0;
  const momChange =
    lastMonth > 0 ? Math.round(((currMonth - lastMonth) / lastMonth) * 1000) / 10 : null;

  // 최근 활동 (최근 변경된 기업 5개)
  const recentChanges = [...allCompanies]
    .sort((a, b) => new Date((b as any).updated_at ?? b.received_at).getTime() - new Date((a as any).updated_at ?? a.received_at).getTime())
    .slice(0, 6);

  // 수수료 합계
  const totalFeeScheduled = allContracts
    .filter((c) => c.payment_status === "scheduled")
    .reduce((sum, c) => sum + Number(c.hvp_fee_amount ?? 0), 0);

  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {now.getFullYear()}년 {now.getMonth() + 1}월 · 전체 운영 현황
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/pipeline">
            <Button variant="outline">파이프라인 →</Button>
          </Link>
          <NewCompanyModal hvps={hvpList} label="+ 신규 기업" />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">{k.label}</div>
            <div className="text-2xl font-bold text-zinc-900">{k.value}</div>
            <div className={`text-xs mt-2 ${k.positive ? "text-emerald-600" : "text-zinc-400"}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 단계별 분포 */}
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">단계별 분포</h2>
            <Link href="/admin/pipeline" className="text-xs text-zinc-500 hover:text-zinc-900">
              파이프라인 →
            </Link>
          </div>
          <div className="space-y-3">
            {stageDist.map((s) => (
              <div key={s.stage}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-600">{s.name}</span>
                  <span className="text-zinc-900 font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color}`}
                    style={{ width: `${(s.count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 월별 신규 접수 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">월별 신규 접수</h2>
            <span className="text-xs text-zinc-400">최근 6개월</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40 mb-3">
            {months.map((mo, i) => {
              const heightPct = maxMonthly > 0 ? Math.max((mo.count / maxMonthly) * 100, 4) : 4;
              return (
                <div key={`${mo.year}-${i}`} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`text-xs ${mo.isCurrent ? "text-emerald-600 font-semibold" : "text-zinc-600"}`}
                  >
                    {mo.count}
                  </div>
                  <div
                    className={`w-full rounded-t ${mo.isCurrent ? "bg-emerald-500" : "bg-zinc-300"}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <div
                    className={`text-[10px] ${mo.isCurrent ? "text-zinc-700 font-medium" : "text-zinc-400"}`}
                  >
                    {mo.label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-3 mt-1 border-t border-zinc-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-zinc-400">평균 접수/월</div>
              <div className="text-zinc-900 font-semibold mt-0.5">{avgMonthly}건</div>
            </div>
            <div>
              <div className="text-zinc-400">전월 대비</div>
              <div
                className={`font-semibold mt-0.5 ${
                  momChange === null
                    ? "text-zinc-400"
                    : momChange > 0
                      ? "text-emerald-600"
                      : momChange < 0
                        ? "text-rose-600"
                        : "text-zinc-700"
                }`}
              >
                {momChange === null ? "—" : `${momChange > 0 ? "↑" : momChange < 0 ? "↓" : "→"} ${Math.abs(momChange)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-5">최근 활동</h2>
          {recentChanges.length === 0 ? (
            <div className="text-sm text-zinc-400 text-center py-6">아직 활동 기록이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {recentChanges.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      SALES_STAGE_COLORS[c.sales_stage as keyof typeof SALES_STAGE_COLORS]?.dot ?? "bg-zinc-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/companies/${c.id}`} className="text-zinc-900 font-medium hover:underline">
                      {c.name}
                    </Link>
                    <span className="text-zinc-500 ml-2 text-xs">
                      {SALES_STAGE_LABELS[c.sales_stage as keyof typeof SALES_STAGE_LABELS]}
                      {c.consulting_stage
                        ? ` · ${CONSULTING_STAGE_LABELS[c.consulting_stage as keyof typeof CONSULTING_STAGE_LABELS]}`
                        : ""}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">{timeAgo(c.updated_at ?? c.received_at)}</span>
                </div>
              ))}
            </div>
          )}
          {totalFeeScheduled > 0 ? (
            <div className="mt-4 pt-4 border-t border-zinc-100 text-xs text-zinc-500">
              💰 정산 예정 HVP 수수료 누계: <span className="text-zinc-900 font-medium">{Math.round(totalFeeScheduled).toLocaleString()}만원</span>
            </div>
          ) : null}
        </div>

        {/* 임박 To-do (놓치면 안 되는 것) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">⏰ 임박 To-do</h2>
            <Link href="/admin/todos" className="text-xs text-zinc-500 hover:text-zinc-900">
              전체 →
            </Link>
          </div>
          {overdueTodos.length + todayDue.length + weekDue.length === 0 ? (
            <div className="text-sm text-zinc-400 text-center py-6">임박한 To-do가 없습니다 ✨</div>
          ) : (
            <div className="space-y-4">
              <TodoGroup label="지난 마감" tone="rose" todos={overdueTodos} />
              <TodoGroup label="오늘 마감" tone="amber" todos={todayDue} />
              <TodoGroup label="이번 주" tone="blue" todos={weekDue} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function TodoGroup({
  label,
  tone,
  todos,
}: {
  label: string;
  tone: "rose" | "amber" | "blue";
  todos: { id: number; title: string; due_date: string | null; category: string | null; companies: { id: number; name: string } | null }[];
}) {
  if (todos.length === 0) return null;
  const toneCls = {
    rose: "bg-rose-50 border-rose-200 text-rose-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  }[tone];
  const dot = { rose: "bg-rose-500", amber: "bg-amber-500", blue: "bg-blue-400" }[tone];
  return (
    <div>
      <div className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border mb-2 ${toneCls}`}>
        {label} {todos.length}
      </div>
      <div className="space-y-1.5">
        {todos.slice(0, 6).map((t) => (
          <div key={t.id} className="flex items-start gap-2 text-sm">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
            <div className="flex-1 min-w-0">
              <div className="text-zinc-800 truncate">{t.title}</div>
              <div className="text-[11px] text-zinc-400">
                {t.due_date}
                {t.companies ? ` · ${t.companies.name}` : t.category === "hvp_onboarding" ? " · HVP 온보딩" : ""}
              </div>
            </div>
          </div>
        ))}
        {todos.length > 6 ? <div className="text-[11px] text-zinc-400 pl-3.5">+ {todos.length - 6}개 더</div> : null}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}
