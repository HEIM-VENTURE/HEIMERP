import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Video,
  CalendarClock,
  Users,
  ExternalLink,
  Copy,
  Download,
  FileText,
} from "lucide-react";
import {
  findDemoDayById,
  STATUS_LABEL,
  STATUS_COLOR,
  SCORE_DIMENSIONS,
  calcStartupScores,
} from "@/lib/mock-demoday";

export const metadata = { title: "데모데이 상세 · HEIM ERP" };

type Props = { params: Promise<{ id: string }> };

export default async function DemoDayDetailPage({ params }: Props) {
  const { id } = await params;
  const d = findDemoDayById(id);
  if (!d) return notFound();

  const c = STATUS_COLOR[d.status];
  const submitted = d.evaluators.filter((e) => e.submitted).length;
  const submitRate = d.evaluators.length > 0 ? Math.round((submitted / d.evaluators.length) * 100) : 0;

  const evaluateUrl = `/evaluate/${d.id}`;
  const fullEvaluateUrl = `https://heim-erp.vercel.app${evaluateUrl}`;

  return (
    <>
      <Link
        href="/admin/demoday"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        데모데이
      </Link>

      {/* Hero */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full"
                style={{ background: c.bg, color: c.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
                {STATUS_LABEL[d.status]}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">{d.code}</span>
            </div>
            <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight mb-1.5">
              {d.title}
            </h1>
            <div className="flex items-center gap-4 text-[13px] text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-zinc-400" />
                {d.date} · {d.time}
              </span>
              {d.zoom_url ? (
                <a
                  href={d.zoom_url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 text-brand hover:underline"
                >
                  <Video className="w-3.5 h-3.5" />
                  Zoom 링크
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Evaluate URL sharing */}
        <div className="mt-6 pt-5 border-t border-zinc-100">
          <div className="text-[11.5px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            심사역용 평가 링크
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[12.5px] text-zinc-700 font-mono truncate">
              {fullEvaluateUrl}
            </code>
            <Link
              href={evaluateUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand text-white text-[12.5px] font-medium hover:bg-brand/90 transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              열기
            </Link>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            데모데이 당일 이 링크를 심사역들께 전달하세요. 로그인 불필요, 이름·소속만 입력.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          <QuickStat label="참여 기업" value={`${d.startups.length}곳`} />
          <QuickStat label="초청 심사역" value={`${d.evaluators.length}명`} />
          <QuickStat label="제출 평가" value={`${submitted}/${d.evaluators.length} (${submitRate}%)`} />
          <QuickStat label="총 평가 건수" value={`${d.evaluations.length}건`} />
        </div>
      </div>

      {/* 2-column: 참여 스타트업 (평가 취합) + 심사역 명단 */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-5">
        {/* LEFT: 참여 스타트업 (평가 취합 결과) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[14px] font-semibold text-zinc-900">참여 기업 · 평가 결과</h2>
            {d.status === "completed" && d.evaluations.length > 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900"
                title="Mock — 다음 단계에서 구현"
              >
                <Download className="w-3.5 h-3.5" />
                평가표 내보내기 (CSV)
              </button>
            ) : null}
          </div>
          {d.startups.map((s) => {
            const evals = d.evaluations.filter((e) => e.startup_id === s.id);
            const { overall, byDimension } = calcStartupScores(d, s.id);
            return (
              <div key={s.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                {/* Startup header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-zinc-400">{s.pitch_time}</span>
                      <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                        {s.stage}
                      </span>
                    </div>
                    <Link
                      href={`/admin/companies/${s.company_id}`}
                      className="text-[16px] font-semibold text-zinc-900 hover:text-brand hover:underline"
                    >
                      {s.company_name}
                    </Link>
                    <div className="text-[12.5px] text-zinc-600 mt-0.5">{s.tagline}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider">평균</div>
                    <div className="text-[24px] font-bold tabular-nums text-zinc-900 leading-none">
                      {overall > 0 ? overall.toFixed(1) : "—"}
                      <span className="text-[11.5px] text-zinc-400 font-normal">/5</span>
                    </div>
                    <div className="text-[10.5px] text-zinc-500 mt-0.5">{evals.length}명 평가</div>
                  </div>
                </div>

                {/* Dimension scores */}
                {evals.length > 0 ? (
                  <div className="grid grid-cols-5 gap-2 pt-4 border-t border-zinc-100">
                    {SCORE_DIMENSIONS.map((dim) => {
                      const score = byDimension[dim.key];
                      return (
                        <div key={dim.key} className="text-center">
                          <div className="text-[10.5px] text-zinc-500 font-medium mb-1">{dim.label}</div>
                          <div className="text-[15px] font-bold tabular-nums text-zinc-900">
                            {score > 0 ? score.toFixed(1) : "—"}
                          </div>
                          <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand to-brand-accent rounded-full"
                              style={{ width: `${(score / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[13px] text-zinc-400">
                    아직 평가 없음
                  </div>
                )}

                {/* Individual comments */}
                {evals.length > 0 ? (
                  <details className="mt-4 pt-4 border-t border-zinc-100">
                    <summary className="cursor-pointer text-[12.5px] text-zinc-600 hover:text-zinc-900 select-none">
                      개별 심사역 코멘트 보기 ({evals.length}건)
                    </summary>
                    <div className="mt-3 space-y-3">
                      {evals.map((e) => (
                        <div key={e.id} className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                          <div className="flex items-baseline justify-between mb-1.5">
                            <div>
                              <span className="text-[12.5px] font-semibold text-zinc-900">{e.evaluator_name}</span>
                              <span className="text-[11px] text-zinc-500 ml-1.5">
                                {e.evaluator_organization}
                                {e.evaluator_role ? ` · ${e.evaluator_role}` : ""}
                              </span>
                            </div>
                            {e.followup_interest === "yes" ? (
                              <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                                후속 관심
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[12.5px] text-zinc-800 leading-relaxed mb-2">
                            {e.overall_comment}
                          </div>
                          {e.strengths ? (
                            <div className="text-[11.5px] text-zinc-600 mt-1">
                              <b className="text-emerald-700">강점</b> · {e.strengths}
                            </div>
                          ) : null}
                          {e.weaknesses ? (
                            <div className="text-[11.5px] text-zinc-600 mt-1">
                              <b className="text-amber-700">약점·보완</b> · {e.weaknesses}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* RIGHT: 심사역 명단 + notes */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-900">초청 심사역</h3>
              </div>
              <button
                type="button"
                className="text-[11.5px] text-brand hover:underline"
                title="Mock — 다음 단계"
              >
                + 초청
              </button>
            </div>
            <div className="space-y-2">
              {d.evaluators.map((e) => (
                <div key={e.id} className="flex items-start gap-3 py-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5 ${
                      e.submitted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {e.submitted ? "✓" : e.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-zinc-900">{e.name}</div>
                    <div className="text-[11px] text-zinc-500">{e.organization}</div>
                    {e.submitted && e.submitted_at ? (
                      <div className="text-[10px] text-emerald-600 mt-0.5">
                        제출 {e.submitted_at.split("T")[1].slice(0, 5)}
                      </div>
                    ) : e.invited ? (
                      <div className="text-[10px] text-zinc-400 mt-0.5">초청됨 · 미제출</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {d.notes ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                운영 메모
              </h3>
              <p className="text-[12.5px] text-zinc-700 leading-relaxed whitespace-pre-line">
                {d.notes}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10.5px] text-zinc-500 font-medium">{label}</div>
      <div className="text-[13.5px] text-zinc-900 font-semibold tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}
