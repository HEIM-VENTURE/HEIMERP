import Link from "next/link";
import {
  Inbox,
  Building2,
  Kanban,
  Coins,
  LineChart,
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
import { MOCK_APPLICATIONS, STATUS_LABEL, STATUS_COLOR } from "@/lib/mock-applications";

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

  const [companiesRes, contractsRes, imminentRes, profileRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, sales_stage, consulting_stage, received_at, name, updated_at"),
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
  ]);

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

  // Mock 접수 상태
  const pendingApplications = MOCK_APPLICATIONS.filter(
    (a) => a.status === "new" || a.status === "reviewing"
  ).length;

  const recentChanges = [...allCompanies]
    .sort(
      (a, b) =>
        new Date((b as any).updated_at ?? b.received_at).getTime() -
        new Date((a as any).updated_at ?? a.received_at).getTime()
    )
    .slice(0, 5);

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
          접수 · 기업 · 프로젝트 · 투자 딜 · 모니터링
         ═══════════════════════════════════════════════ */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
          기업 성장 여정
        </h2>
        <span className="text-[11.5px] text-zinc-400">접수 → 프로젝트 → 투자 → 성장</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
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
          href="/admin/projects"
          icon={<Kanban />}
          title="프로젝트"
          value={0}
          unit="건"
          trend="구축 예정"
          tint="#7A8BA0"
          comingSoon
        />
        <DomainCard
          href="/admin/deals"
          icon={<Coins />}
          title="투자 딜"
          value={0}
          unit="건"
          trend="구축 예정"
          tint="#8578C4"
          comingSoon
        />
        <DomainCard
          href="/admin/monitoring"
          icon={<LineChart />}
          title="사후 모니터링"
          value={0}
          unit="개 기업"
          trend="구축 예정"
          tint="#6DA37C"
          comingSoon
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
            hint={`${MOCK_APPLICATIONS.filter((a) => a.status === "new").length}건 미배정`}
            link="/admin/applications"
          />
          {MOCK_APPLICATIONS.filter(
            (a) => a.status === "new" || a.status === "reviewing"
          ).length === 0 ? (
            <EmptyLine>검토 대기 없음</EmptyLine>
          ) : (
            <div className="space-y-1">
              {MOCK_APPLICATIONS.filter(
                (a) => a.status === "new" || a.status === "reviewing"
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
  return (
    <Link
      href={comingSoon ? "#" : href}
      onClick={comingSoon ? (e) => e.preventDefault() : undefined}
      className={`group relative rounded-2xl p-4 transition-all ${
        comingSoon
          ? "cursor-default"
          : "hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
      }`}
      style={{
        background: comingSoon
          ? "#FAFAF7"
          : `linear-gradient(180deg, #FFFFFF 0%, ${tint}08 100%)`,
        border: `1px solid ${comingSoon ? "#E5E1D8" : tint + "22"}`,
      }}
    >
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
            className="text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
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
    </Link>
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
