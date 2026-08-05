import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Kanban,
  User,
  Calendar,
  Coins,
  Target,
  Users,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import {
  findProjectById,
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_COLOR,
  PROJECT_STAGE_LABEL,
  PROJECT_STAGE_COLOR,
} from "@/lib/mock-projects";

export const metadata = { title: "프로젝트 상세 · HEIM ERP" };

type Props = { params: Promise<{ id: string }> };

// Mock 프로젝트 단계 진행 흐름
const STAGE_ORDER = ["prep", "active", "review", "closing", "done"] as const;

// Mock 업무 목록 (프로젝트 상세용)
const MOCK_TASKS = [
  { id: 1, title: "최근 3개년 재무제표 수령", done: true, due: "2026-07-20", owner: "허유나" },
  { id: 2, title: "IR Deck v3 초안 작성", done: true, due: "2026-07-25", owner: "기동현" },
  { id: 3, title: "TIPS 운영사 리스트업", done: true, due: "2026-07-30", owner: "허유나" },
  { id: 4, title: "MFDS 인증 로드맵 자료 정리", done: false, due: "2026-08-08", owner: "허유나" },
  { id: 5, title: "IR Deck v3 최종본 대표 리뷰", done: false, due: "2026-08-10", owner: "허유나" },
  { id: 6, title: "TIPS 운영사 IR — 오르빗파트너스", done: false, due: "2026-08-12", owner: "허유나" },
  { id: 7, title: "지원서류 · 사업계획서 v4 제출", done: false, due: "2026-08-18", owner: "기동현" },
];

const MOCK_MILESTONES = [
  { id: 1, title: "킥오프 미팅", date: "2026-07-15", done: true },
  { id: 2, title: "1차 자료 수령", date: "2026-07-25", done: true },
  { id: 3, title: "IR Deck v3 완성", date: "2026-08-05", done: true },
  { id: 4, title: "TIPS 운영사 IR", date: "2026-08-12", done: false, current: true },
  { id: 5, title: "지원서 제출 마감", date: "2026-08-20", done: false },
  { id: 6, title: "TIPS 심사 결과 발표", date: "2026-10-15", done: false },
];

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const p = findProjectById(id);
  if (!p) return notFound();

  const typeC = PROJECT_TYPE_COLOR[p.type];
  const stageC = PROJECT_STAGE_COLOR[p.stage];
  const stageIdx = STAGE_ORDER.indexOf(p.stage as any);

  const doneTasks = MOCK_TASKS.filter((t) => t.done).length;

  return (
    <>
      {/* Breadcrumb */}
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        프로젝트
      </Link>

      {/* Hero header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/15 to-brand-accent/10 border border-brand/10 flex items-center justify-center text-brand shrink-0">
            <Kanban className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full"
                style={{ background: typeC.bg, color: typeC.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: typeC.dot }} />
                {PROJECT_TYPE_LABEL[p.type]}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full"
                style={{ background: stageC.bg, color: stageC.text }}
              >
                {PROJECT_STAGE_LABEL[p.stage]}
              </span>
              <span className="text-[11.5px] text-zinc-500 font-mono ml-1">{p.code}</span>
            </div>
            <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight mb-1">
              {p.name}
            </h1>
            <div className="text-[13px] text-zinc-600">
              <Link href={`/admin/companies/${p.company_id}`} className="hover:text-brand hover:underline">
                {p.company_name}
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {}}
            className="text-[12.5px] text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors shrink-0"
            title="Mock — 편집 미구현"
          >
            프로젝트 편집
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-5 border-t border-zinc-100">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[12px] font-medium text-zinc-600">진척</span>
            <span className="text-[12.5px] font-bold text-zinc-900 tabular-nums">
              {p.progress}% · 업무 {doneTasks}/{MOCK_TASKS.length}
            </span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${p.progress}%`, background: stageC.dot }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-2 mt-5">
          <QuickStat icon={<User />} label="PM" value={p.pm} />
          <QuickStat
            icon={<Users />}
            label="팀"
            value={`${p.team.length}명`}
          />
          <QuickStat icon={<Calendar />} label="시작" value={p.started_at} />
          <QuickStat icon={<Target />} label="목표 종료" value={p.target_end} />
          <QuickStat
            icon={<Coins />}
            label="계약"
            value={p.contract_amount ? `${p.contract_amount.toLocaleString()}만` : "—"}
          />
        </div>
      </div>

      {/* 12-stage timeline for project */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-zinc-900">프로젝트 단계</h2>
          <span className="text-[11.5px] text-zinc-500">
            {stageIdx + 1}/{STAGE_ORDER.length} 단계
          </span>
        </div>
        <div className="relative">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-zinc-100" />
          <div
            className="absolute top-3 left-0 h-0.5"
            style={{
              width: `${((stageIdx + 1) / STAGE_ORDER.length) * 100}%`,
              background: `linear-gradient(90deg, ${stageC.dot} 0%, ${stageC.dot}88 100%)`,
            }}
          />
          <div className="relative grid grid-cols-5">
            {STAGE_ORDER.map((s, i) => {
              const done = i < stageIdx;
              const current = i === stageIdx;
              return (
                <div key={s} className="flex flex-col items-center text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                      done
                        ? "bg-emerald-500"
                        : current
                        ? "ring-4 ring-blue-100"
                        : "bg-white border-2 border-zinc-200"
                    }`}
                    style={current ? { background: stageC.dot } : undefined}
                  >
                    {done ? "✓" : current ? "●" : ""}
                  </div>
                  <div
                    className={`text-[11px] mt-2 ${
                      current ? "text-zinc-900 font-semibold" : done ? "text-zinc-700" : "text-zinc-400"
                    }`}
                  >
                    {PROJECT_STAGE_LABEL[s]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        {/* LEFT: 업무 목록 + 마일스톤 */}
        <div className="space-y-5">
          {/* Tasks */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900">업무 목록</h3>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {doneTasks}/{MOCK_TASKS.length} 완료 · Mock 데이터
                </div>
              </div>
              <button className="text-[12px] text-brand hover:underline" title="Mock">
                + 업무 추가
              </button>
            </div>
            <div className="space-y-1">
              {MOCK_TASKS.map((t) => {
                const overdue =
                  !t.done && new Date(t.due) < new Date();
                return (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 px-2 py-2 rounded-md hover:bg-zinc-50 transition-colors -mx-2"
                  >
                    {t.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[13px] ${
                          t.done ? "text-zinc-400 line-through" : "text-zinc-900"
                        }`}
                      >
                        {t.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10.5px] tabular-nums ${
                            overdue ? "text-rose-600 font-medium" : "text-zinc-500"
                          }`}
                        >
                          {overdue ? "⚠ " : ""}
                          {t.due}
                        </span>
                        <span className="text-[10.5px] text-zinc-400">·</span>
                        <span className="text-[10.5px] text-zinc-500">{t.owner}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {p.notes ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="text-[14px] font-semibold text-zinc-900 mb-3">노트</h3>
              <p className="text-[13.5px] text-zinc-700 leading-relaxed whitespace-pre-line">
                {p.notes}
              </p>
            </div>
          ) : null}
        </div>

        {/* RIGHT: Milestones + placeholder */}
        <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          {/* Milestones */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <h3 className="text-[14px] font-semibold text-zinc-900 mb-4 pb-3 border-b border-zinc-100">
              마일스톤
            </h3>
            <ol className="space-y-3.5 relative">
              <div
                className="absolute left-[10px] top-2 bottom-2 w-px bg-zinc-200"
                aria-hidden
              />
              {MOCK_MILESTONES.map((m) => {
                const anyM = m as { current?: boolean };
                return (
                  <li key={m.id} className="flex gap-3 items-start relative">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        m.done
                          ? "bg-emerald-500 text-white"
                          : anyM.current
                          ? "bg-white border-2"
                          : "bg-white border-2 border-zinc-200"
                      }`}
                      style={
                        anyM.current
                          ? { borderColor: stageC.dot }
                          : undefined
                      }
                    >
                      {m.done ? <CheckCircle2 className="w-3 h-3" /> : null}
                      {anyM.current ? (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: stageC.dot }}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 pt-0">
                      <div
                        className={`text-[12.5px] ${
                          anyM.current
                            ? "text-zinc-900 font-semibold"
                            : m.done
                            ? "text-zinc-500"
                            : "text-zinc-700"
                        }`}
                      >
                        {m.title}
                      </div>
                      <div className="text-[10.5px] text-zinc-400 tabular-nums flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {m.date}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Meetings & Files placeholder */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-500">
                미팅 · 자료 · 산출물
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="미팅" value={p.meetings_count} />
              <StatBox label="자료" value={p.files_count} />
              <StatBox label="투자 딜" value={p.investment_deal_count} />
            </div>
            <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
              프로젝트별 미팅·산출물·투자딜 관리 UI는 다음 단계에서 구축 예정.
            </p>
          </div>
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

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-zinc-50 text-center">
      <div className="text-[10.5px] text-zinc-500 font-medium">{label}</div>
      <div className="text-[18px] font-bold text-zinc-900 tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
