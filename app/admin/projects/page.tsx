import Link from "next/link";
import { Kanban, Sparkles } from "lucide-react";
import {
  MOCK_PROJECTS,
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_COLOR,
  PROJECT_STAGE_LABEL,
  PROJECT_STAGE_COLOR,
  type ProjectStage,
} from "@/lib/mock-projects";

export const metadata = { title: "프로젝트 · HEIM ERP" };

const TABS: { key: ProjectStage | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "active", label: "진행 중" },
  { key: "prep", label: "준비" },
  { key: "review", label: "검토" },
  { key: "closing", label: "마무리" },
  { key: "done", label: "완료" },
  { key: "on_hold", label: "보류" },
];

type Props = {
  searchParams: Promise<{ stage?: string }>;
};

export default async function ProjectsListPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeTab = (params.stage ?? "all") as ProjectStage | "all";

  const rows =
    activeTab === "all"
      ? MOCK_PROJECTS
      : MOCK_PROJECTS.filter((p) => p.stage === activeTab);

  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] =
      t.key === "all"
        ? MOCK_PROJECTS.length
        : MOCK_PROJECTS.filter((p) => p.stage === t.key).length;
    return acc;
  }, {});

  const totalContract = MOCK_PROJECTS.filter((p) => p.stage !== "on_hold")
    .reduce((s, p) => s + (p.contract_amount ?? 0), 0);
  const activeCount = MOCK_PROJECTS.filter((p) => p.stage === "active").length;
  const doneCount = MOCK_PROJECTS.filter((p) => p.stage === "done").length;

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">프로젝트</h1>
          <p className="text-sm text-zinc-500 mt-1">
            기업별 프로젝트를 분리 관리 — TIPS 지원 · IR · 투자유치 · 성장 전략 등 각각 별도 단위.
          </p>
        </div>
        <div className="text-xs text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Mock 데이터 · Supabase projects 테이블 이관 예정
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <SummaryStat label="전체 프로젝트" value={MOCK_PROJECTS.length} suffix="건" />
        <SummaryStat label="진행 중" value={activeCount} suffix="건" tint="#3B82F6" />
        <SummaryStat label="완료" value={doneCount} suffix="건" tint="#10B981" />
        <SummaryStat
          label="계약 금액 (활성)"
          value={totalContract.toLocaleString()}
          suffix="만원"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-zinc-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/projects" : `/admin/projects?stage=${t.key}`}
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

      {/* Project cards grid */}
      {rows.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl py-12 text-center text-sm text-zinc-400">
          해당 단계의 프로젝트가 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((p) => {
            const typeC = PROJECT_TYPE_COLOR[p.type];
            const stageC = PROJECT_STAGE_COLOR[p.stage];
            return (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="group block bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full"
                    style={{ background: typeC.bg, color: typeC.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: typeC.dot }} />
                    {PROJECT_TYPE_LABEL[p.type]}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full"
                    style={{ background: stageC.bg, color: stageC.text }}
                  >
                    {PROJECT_STAGE_LABEL[p.stage]}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug mb-1 line-clamp-2 group-hover:text-brand transition-colors">
                  {p.name}
                </h3>
                <div className="text-[12px] text-zinc-500 mb-4 truncate">
                  {p.company_name} · {p.code}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-zinc-500">진척</span>
                    <span className="text-[11px] font-semibold text-zinc-900 tabular-nums">
                      {p.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.progress}%`,
                        background: stageC.dot,
                      }}
                    />
                  </div>
                </div>

                {/* Next milestone */}
                {p.next_milestone ? (
                  <div className="p-3 rounded-lg bg-zinc-50/70 mb-3">
                    <div className="text-[10.5px] font-medium text-zinc-500 uppercase mb-1">
                      다음 마일스톤
                    </div>
                    <div className="text-[13px] text-zinc-900 font-medium leading-snug">
                      {p.next_milestone}
                    </div>
                    {p.next_milestone_date ? (
                      <div className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                        {p.next_milestone_date}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Meta row */}
                <div className="flex items-center justify-between text-[11.5px] text-zinc-500">
                  <span>PM {p.pm}{p.team.length > 1 ? ` +${p.team.length - 1}` : ""}</span>
                  <div className="flex items-center gap-2.5 text-[11px]">
                    {p.open_tasks > 0 ? (
                      <span title="열린 할 일">◉ {p.open_tasks}</span>
                    ) : null}
                    <span title="미팅">📅 {p.meetings_count}</span>
                    <span title="자료">📎 {p.files_count}</span>
                    {p.investment_deal_count > 0 ? (
                      <span title="투자 딜">💰 {p.investment_deal_count}</span>
                    ) : null}
                  </div>
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
