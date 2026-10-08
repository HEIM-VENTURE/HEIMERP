import Link from "next/link";
import {
  Inbox,
  Building2,
  Bot,
  Coins,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
} from "@/lib/labels";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/mock-applications";
import { listApplications } from "@/lib/applications";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStr = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  const [companiesRes, contractsRes, imminentRes, profileRes, tappingsRes, aiAlertsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, sales_stage, consulting_stage, received_at, name, updated_at, custom_fields, drop_reason, last_contact_at, next_action, next_action_due"),
    supabase.from("contracts").select("id, total_amount"),
    supabase
      .from("todos")
      .select("id, title, due_date, status, companies(id, name)")
      .neq("status", "done")
      .not("due_date", "is", null)
      .lte("due_date", weekStr)
      .order("due_date", { ascending: true })
      .limit(8),
    supabase.from("profiles").select("name").eq("id", user?.id ?? "").single(),
    supabase.from("investor_tappings").select("progress_status, confirmed_operator"),
    supabase.from("ai_staff_posts").select("severity").eq("kind", "alert").eq("status", "open"),
  ]);

  const tappings = tappingsRes.data ?? [];
  const tappingActive = tappings.filter((t) => t.progress_status === "진행중").length;
  const tappingConfirmed = tappings.filter((t) => t.confirmed_operator).length;
  const aiAlerts = aiAlertsRes.data ?? [];
  const aiUrgent = aiAlerts.filter((a) => a.severity === "urgent").length;

  const adminName = (profileRes.data as { name: string } | null)?.name ?? "관리자";
  const allCompanies = companiesRes.data ?? [];
  const allContracts = contractsRes.data ?? [];

  type ImminentTodo = {
    id: number;
    title: string;
    due_date: string | null;
    companies: { id: number; name: string } | null;
  };
  const imminent = (imminentRes.data as unknown as ImminentTodo[]) ?? [];
  const overdue = imminent.filter((t) => t.due_date && t.due_date < todayStr);
  const todayDue = imminent.filter((t) => t.due_date === todayStr);
  const weekDue = imminent.filter((t) => t.due_date && t.due_date > todayStr);

  const totalCompanies = allCompanies.length;
  const kickoffCount = allCompanies.filter((c) => c.sales_stage === "kickoff").length;
  const tipsSelected = allCompanies.filter(
    (c) =>
      c.consulting_stage === "fund_closing" || c.consulting_stage === "final_closing"
  ).length;
  const totalContractValue = allContracts.reduce(
    (s, c) => s + Number(c.total_amount ?? 0),
    0
  );

  // 실제 접수 상태 (활성만)
  const applications = await listApplications();
  const pendingApplications = applications.filter(
    (a) => a.status === "new"
  ).length;

  const recentChanges = [...allCompanies]
    .sort(
      (a, b) =>
        new Date((b as any).updated_at ?? b.received_at).getTime() -
        new Date((a as any).updated_at ?? a.received_at).getTime()
    )
    .slice(0, 5);

  // ── 후속 관리 알림 집계 (방치 / 다음 액션) ──
  const nowTime = Date.now();
  type FollowupRow = {
    id: number;
    name: string;
    pm: string;
    last_contact_at: string | null;
    next_action: string | null;
    next_action_due: string | null;
    daysSinceContact: number | null;
    dueDiff: number | null;
  };
  const followupRows: FollowupRow[] = allCompanies
    .filter((c: any) => !c.drop_reason)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      pm: c.custom_fields?.pm ?? "미지정",
      last_contact_at: c.last_contact_at,
      next_action: c.next_action,
      next_action_due: c.next_action_due,
      daysSinceContact: c.last_contact_at
        ? Math.floor((nowTime - new Date(c.last_contact_at).getTime()) / 86400000)
        : null,
      dueDiff: c.next_action_due
        ? Math.floor((new Date(c.next_action_due).getTime() - nowTime) / 86400000)
        : null,
    }));
  const dueOverdue = followupRows
    .filter((r) => r.dueDiff !== null && r.dueDiff < 0)
    .sort((a, b) => (a.dueDiff ?? 0) - (b.dueDiff ?? 0));
  const dueSoon = followupRows
    .filter((r) => r.dueDiff !== null && r.dueDiff >= 0 && r.dueDiff <= 3)
    .sort((a, b) => (a.dueDiff ?? 0) - (b.dueDiff ?? 0));
  const stale30 = followupRows
    .filter((r) => r.daysSinceContact !== null && r.daysSinceContact >= 30)
    .sort((a, b) => (b.daysSinceContact ?? 0) - (a.daysSinceContact ?? 0));
  const stale14 = followupRows.filter(
    (r) => r.daysSinceContact !== null && r.daysSinceContact >= 14 && r.daysSinceContact < 30
  );
  // 로그인한 사용자가 담당 PM 인 것만 (내 담당 하이라이트)
  const mine = {
    overdue: dueOverdue.filter((r) => r.pm === adminName),
    soon: dueSoon.filter((r) => r.pm === adminName),
    stale30: stale30.filter((r) => r.pm === adminName),
  };
  const myTotal = mine.overdue.length + mine.soon.length + mine.stale30.length;

  const now = new Date();

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            안녕하세요, {adminName}님
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {now.getFullYear()}년 {now.getMonth() + 1}월 {now.getDate()}일 · 오늘의 운영 현황
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          Section 1 — 5 도메인 포털
          접수 · 기업 · 투자 딜 · AI 직원
         ═══════════════════════════════════════════════ */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
          기업 성장 여정
        </h2>
        <span className="text-[11.5px] text-zinc-400">접수 → 기업 → 투자 · AI 직원 점검</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <DomainCard
          href="/admin/applications"
          icon={<Inbox />}
          title="접수 · 검토"
          value={pendingApplications}
          unit="건 대기"
          trend={
            pendingApplications > 0
              ? `${pendingApplications}건 검토 필요`
              : "모두 처리됨"
          }
          tint="#E5531F"
          active
        />
        <DomainCard
          href="/admin/pipeline"
          icon={<Building2 />}
          title="기업 마스터"
          value={totalCompanies}
          unit="개 기업"
          trend={`착수 ${kickoffCount} · TIPS 진행 ${tipsSelected}`}
          tint="#41566B"
          active
        />
        <DomainCard
          href="/admin/deals"
          icon={<Coins />}
          title="투자 딜"
          value={tappingActive}
          unit="개 기업 진행"
          trend={`태핑 대상 ${tappings.length}곳 · 운영사 확정 ${tappingConfirmed}곳`}
          tint="#8578C4"
          active
        />
        <DomainCard
          href="/admin/ai-staff"
          icon={<Bot />}
          title="AI 직원"
          value={aiAlerts.length}
          unit="건 확인 필요"
          trend={aiUrgent > 0 ? `긴급 ${aiUrgent}건` : "매일 아침 자동 점검"}
          tint="#7A8BA0"
          active
        />
      </div>

      {/* ═══════════════════════════════════════════════
          Section 2 — 오늘의 초점: 임박 To-do + 대기 접수
         ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-4 mb-8">
        {/* 임박 To-do */}
        <Card>
          <CardHead
            title="오늘의 할 일"
            hint={`연체 ${overdue.length} · 오늘 ${todayDue.length} · 이번 주 ${weekDue.length}`}
            link="/admin/todos"
          />
          {imminent.length === 0 ? (
            <EmptyLine>임박한 할 일이 없습니다 ✨</EmptyLine>
          ) : (
            <div className="space-y-3.5">
              <TodoGroup label="지난 마감" tone="rose" todos={overdue} />
              <TodoGroup label="오늘 마감" tone="amber" todos={todayDue} />
              <TodoGroup label="이번 주" tone="blue" todos={weekDue} />
            </div>
          )}
        </Card>

        {/* 검토 대기 접수 */}
        <Card>
          <CardHead
            title="검토 대기 · 신규 접수"
            hint={`${pendingApplications}건 미배정`}
            link="/admin/applications"
          />
          {pendingApplications === 0 ? (
            <EmptyLine>검토 대기 없음</EmptyLine>
          ) : (
            <div className="space-y-1">
              {applications.filter(
                (a) => a.status === "new"
              )
                .slice(0, 5)
                .map((a) => {
                  const c = STATUS_COLOR[a.status];
                  return (
                    <Link
                      key={a.id}
                      href={`/admin/applications/${a.id}`}
                      className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors -mx-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: c.dot }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-zinc-900 truncate">
                          {a.company_name}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {a.tagline}
                        </div>
                      </div>
                      <span
                        className="text-[10.5px] px-1.5 py-0.5 rounded font-medium shrink-0"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </Link>
                  );
                })}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Mock 데이터 · Phase 1c 이후 실데이터
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════
          Section · 후속 관리 알림 (방치 기업 · 다음 액션 마감)
         ═══════════════════════════════════════════════ */}
      <FollowupAlertCard
        adminName={adminName}
        myTotal={myTotal}
        myOverdue={mine.overdue}
        mySoon={mine.soon}
        myStale30={mine.stale30}
        allOverdue={dueOverdue}
        allSoon={dueSoon}
        allStale30={stale30}
        stale14Count={stale14.length}
      />

      {/* ═══════════════════════════════════════════════
          Section 3 — 파이프라인 · 최근 활동
         ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 파이프라인 KPI */}
        <Card>
          <CardHead title="파이프라인 · 계약" hint="Supabase 실데이터" link="/admin/pipeline" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="총 기업" value={totalCompanies} suffix="곳" />
            <Stat label="컨설팅 착수" value={kickoffCount} suffix="곳" />
            <Stat label="TIPS 진행" value={tipsSelected} suffix="곳" />
            <Stat
              label="계약 금액 누계"
              value={Math.round(totalContractValue).toLocaleString()}
              suffix="만원"
            />
          </div>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <CardHead title="최근 활동" hint="최근 업데이트된 기업" link="/admin/pipeline" />
          {recentChanges.length === 0 ? (
            <EmptyLine>아직 활동 기록이 없습니다</EmptyLine>
          ) : (
            <div className="space-y-2">
              {recentChanges.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 text-sm py-1">
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      SALES_STAGE_COLORS[c.sales_stage as keyof typeof SALES_STAGE_COLORS]
                        ?.dot ?? "bg-zinc-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="text-zinc-900 font-medium hover:underline text-[13.5px]"
                    >
                      {c.name}
                    </Link>
                    <span className="text-zinc-500 ml-2 text-[11.5px]">
                      {SALES_STAGE_LABELS[c.sales_stage as keyof typeof SALES_STAGE_LABELS]}
                      {c.consulting_stage
                        ? ` · ${CONSULTING_STAGE_LABELS[c.consulting_stage as keyof typeof CONSULTING_STAGE_LABELS]}`
                        : ""}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 shrink-0">
                    {timeAgo(c.updated_at ?? c.received_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════
function DomainCard({
  href,
  icon,
  title,
  value,
  unit,
  trend,
  tint,
  active,
  comingSoon,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: number;
  unit: string;
  trend: string;
  tint: string;
  active?: boolean;
  comingSoon?: boolean;
}) {
  const containerCls = `group relative rounded-2xl p-4 transition-all ${
    comingSoon
      ? "cursor-default"
      : "hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
  }`;
  const containerStyle = {
    background: comingSoon
      ? "#FAFAF7"
      : `linear-gradient(180deg, #FFFFFF 0%, ${tint}08 100%)`,
    border: `1px solid ${comingSoon ? "#E5E1D8" : tint + "22"}`,
  } as const;

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    comingSoon ? (
      <div className={containerCls} style={containerStyle}>
        {children}
      </div>
    ) : (
      <Link href={href} className={containerCls} style={containerStyle}>
        {children}
      </Link>
    );

  return (
    <Wrapper>
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4"
          style={{
            background: comingSoon ? "#F0EFEA" : tint + "14",
            color: comingSoon ? "#9CA3AF" : tint,
          }}
        >
          {icon}
        </div>
        {comingSoon ? (
          <span
            className="text-[9.5px] font-semibold uppercase px-1.5 py-0.5 rounded"
            style={{ background: "#F0EFEA", color: "#8B8579" }}
          >
            준비 중
          </span>
        ) : active ? (
          <ArrowUpRight
            className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors"
          />
        ) : null}
      </div>
      <div
        className="text-[11.5px] font-medium tracking-tight mb-1"
        style={{ color: comingSoon ? "#9CA3AF" : "#5D6B7A" }}
      >
        {title}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[26px] font-bold tabular-nums leading-none"
          style={{ color: comingSoon ? "#9CA3AF" : "#1F2A36" }}
        >
          {value}
        </span>
        <span className="text-[11.5px] text-zinc-500">{unit}</span>
      </div>
      <div
        className="text-[11px] mt-2"
        style={{ color: comingSoon ? "#B0B0A8" : "#8A9099" }}
      >
        {trend}
      </div>
    </Wrapper>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">{children}</div>
  );
}

function CardHead({
  title,
  hint,
  link,
}: {
  title: string;
  hint?: string;
  link?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-zinc-100">
      <div>
        <h3 className="text-[13.5px] font-semibold text-zinc-900">{title}</h3>
        {hint ? <div className="text-[11px] text-zinc-400 mt-0.5">{hint}</div> : null}
      </div>
      {link ? (
        <Link
          href={link}
          className="text-[11.5px] text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-0.5"
        >
          전체 <ArrowRight className="w-3 h-3" />
        </Link>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-zinc-50/70">
      <div className="text-[11px] text-zinc-500 font-medium">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[20px] font-bold text-zinc-900 tabular-nums leading-none">
          {value}
        </span>
        {suffix ? <span className="text-[11px] text-zinc-500">{suffix}</span> : null}
      </div>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-6 text-[13px] text-zinc-400">{children}</div>
  );
}

function TodoGroup({
  label,
  tone,
  todos,
}: {
  label: string;
  tone: "rose" | "amber" | "blue";
  todos: {
    id: number;
    title: string;
    due_date: string | null;
    companies: { id: number; name: string } | null;
  }[];
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
      <div
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded border mb-1.5 ${toneCls}`}
      >
        <Clock className="w-2.5 h-2.5" />
        {label} {todos.length}
      </div>
      <div className="space-y-1">
        {todos.slice(0, 5).map((t) => (
          <div key={t.id} className="flex items-start gap-2 text-sm py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
            <div className="flex-1 min-w-0">
              <div className="text-zinc-800 text-[13px] truncate">{t.title}</div>
              <div className="text-[11px] text-zinc-400">
                {t.due_date}
                {t.companies ? ` · ${t.companies.name}` : ""}
              </div>
            </div>
          </div>
        ))}
        {todos.length > 5 ? (
          <div className="text-[11px] text-zinc-400 pl-3.5">+ {todos.length - 5}개 더</div>
        ) : null}
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

type FollowupMini = {
  id: number;
  name: string;
  pm: string;
  last_contact_at: string | null;
  next_action: string | null;
  next_action_due: string | null;
  daysSinceContact: number | null;
  dueDiff: number | null;
};

function FollowupAlertCard({
  adminName,
  myTotal,
  myOverdue,
  mySoon,
  myStale30,
  allOverdue,
  allSoon,
  allStale30,
  stale14Count,
}: {
  adminName: string;
  myTotal: number;
  myOverdue: FollowupMini[];
  mySoon: FollowupMini[];
  myStale30: FollowupMini[];
  allOverdue: FollowupMini[];
  allSoon: FollowupMini[];
  allStale30: FollowupMini[];
  stale14Count: number;
}) {
  const totalUrgent = allOverdue.length + allSoon.length + allStale30.length;
  if (totalUrgent === 0 && stale14Count === 0) {
    return (
      <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-[12.5px] text-emerald-700">
        ✅ 지금 급한 후속 관리 건이 없습니다. 모든 기업이 정상 흐름.
      </div>
    );
  }

  return (
    <div className="mb-5">
      {/* 헤더 */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-[15.5px] font-bold text-zinc-900 flex items-center gap-2">
            🔔 후속 관리 알림
            {myTotal > 0 ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                내 담당 {myTotal}건
              </span>
            ) : null}
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            마감 지남 · D-3 · 30일 방치 기업을 자동으로 추립니다. 매일 평일 09:00 Slack 알림도 발송.
          </p>
        </div>
        <Link
          href="/admin/pipeline"
          className="text-[11.5px] text-brand hover:underline whitespace-nowrap"
        >
          전체 파이프라인 →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 마감 지남 */}
        <AlertBucket
          title="⏰ 마감 지남"
          tone="rose"
          mine={myOverdue}
          all={allOverdue}
          adminName={adminName}
          renderMeta={(r) =>
            `${-(r.dueDiff ?? 0)}일 지남${r.next_action ? ` · ${r.next_action}` : ""}`
          }
        />
        {/* D-3 */}
        <AlertBucket
          title="🔔 D-3 이내"
          tone="amber"
          mine={mySoon}
          all={allSoon}
          adminName={adminName}
          renderMeta={(r) =>
            `${r.dueDiff === 0 ? "오늘" : `D-${r.dueDiff}`}${r.next_action ? ` · ${r.next_action}` : ""}`
          }
        />
        {/* 방치 30일+ */}
        <AlertBucket
          title="🚨 방치 30일+"
          tone="zinc"
          mine={myStale30}
          all={allStale30}
          adminName={adminName}
          renderMeta={(r) => `${r.daysSinceContact}일 접촉 없음`}
        />
      </div>

      {stale14Count > 0 ? (
        <div className="mt-3 text-[11.5px] text-zinc-500 text-center">
          + 14~30일 접촉 없음 {stale14Count}곳 ·{" "}
          <Link href="/admin/pipeline" className="text-brand hover:underline">
            전체 파이프라인에서 보기 →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function AlertBucket({
  title,
  tone,
  mine,
  all,
  adminName,
  renderMeta,
}: {
  title: string;
  tone: "rose" | "amber" | "zinc";
  mine: FollowupMini[];
  all: FollowupMini[];
  adminName: string;
  renderMeta: (r: FollowupMini) => string;
}) {
  const toneCls = {
    rose: "border-rose-200 bg-rose-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    zinc: "border-zinc-200 bg-zinc-50/40",
  }[tone];
  const titleCls = {
    rose: "text-rose-700",
    amber: "text-amber-700",
    zinc: "text-zinc-700",
  }[tone];

  const others = all.filter((r) => r.pm !== adminName);
  const combined = [...mine, ...others].slice(0, 8);

  return (
    <div className={`rounded-xl border p-3.5 ${toneCls}`}>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className={`text-[13px] font-semibold ${titleCls}`}>{title}</h3>
        <span className="text-[11px] font-semibold text-zinc-700 tabular-nums">
          {all.length}건
        </span>
      </div>
      {combined.length === 0 ? (
        <div className="text-[11.5px] text-zinc-400 py-2">없음</div>
      ) : (
        <ul className="space-y-1.5">
          {combined.map((r) => {
            const isMine = r.pm === adminName;
            return (
              <li key={r.id} className="text-[12px] leading-snug">
                <Link
                  href={`/admin/companies/${r.id}`}
                  className="group block px-1.5 py-1 rounded hover:bg-white/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`font-medium truncate ${isMine ? "text-brand" : "text-zinc-900"}`}>
                      {isMine ? "★ " : ""}{r.name}
                    </span>
                    <span className="text-[10.5px] text-zinc-400 shrink-0">{r.pm}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">{renderMeta(r)}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {all.length > combined.length ? (
        <div className="mt-2 text-[11px] text-zinc-400 text-right">+ {all.length - combined.length}곳</div>
      ) : null}
    </div>
  );
}
