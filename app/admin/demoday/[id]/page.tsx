import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  ArrowLeft,
  CalendarClock,
  Video,
  Users,
  FileText,
  ExternalLink,
} from "lucide-react";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { VERDICT_LABEL, type RoundStatus } from "@/lib/demoday/types";
import { InvitePanel, CopyButton } from "./invite-panel";
import { StatusEditor } from "./status-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "데모데이 상세 · HEIM ERP" };

const STATUS_LABEL: Record<RoundStatus, string> = {
  draft: "준비 중",
  scheduled: "예정",
  live: "진행 중",
  completed: "완료",
};

const STATUS_COLOR: Record<RoundStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "#F0F1F3", text: "#4B5563", dot: "#9CA3AF" },
  scheduled: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  live: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  completed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
};

const SCORE_KEYS: { key: "team" | "market" | "tech" | "bm"; label: string }[] = [
  { key: "team", label: "팀" },
  { key: "market", label: "시장" },
  { key: "tech", label: "기술" },
  { key: "bm", label: "BM" },
];

type Props = { params: Promise<{ id: string }> };

export default async function DemoDayDetailPage({ params }: Props) {
  const { id } = await params;
  const repo = getAdminRepository();
  const [summary, invites, hdrs] = await Promise.all([
    repo.getRoundSummary(id).catch(() => null),
    repo.listInvites(id).catch(() => []),
    headers(),
  ]);
  if (!summary) return notFound();

  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const { round, startupCount, reviewerCount, submissionCount, submissionRate, perStartup } = summary;
  const c = STATUS_COLOR[round.status];
  const pendingReviewerIds = new Set(summary.pendingReviewers.map((r) => r.id));

  const companyIds = perStartup.map((p) => p.startup.companyId);
  const currentInvitedIds = invites.map((i) => i.reviewerId);

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
                {STATUS_LABEL[round.status]}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">{round.code}</span>
              <StatusEditor roundId={round.id} current={round.status} />
            </div>
            <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight mb-1.5">
              {round.title}
            </h1>
            <div className="flex items-center gap-4 text-[13px] text-zinc-600 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-zinc-400" />
                {round.date}
                {round.timeRange ? ` · ${round.timeRange}` : ""}
              </span>
              {round.zoomUrl ? (
                <a
                  href={round.zoomUrl}
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

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          <QuickStat label="참여 기업" value={`${startupCount}곳`} />
          <QuickStat label="초청 심사역" value={`${reviewerCount}명`} />
          <QuickStat
            label="제출 평가"
            value={`${submissionCount}건 (${Math.round(submissionRate * 100)}%)`}
          />
          <QuickStat label="미제출 심사역" value={`${summary.pendingReviewers.length}명`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-5">
        {/* LEFT: 참여 스타트업 (평가 결과) */}
        <div className="space-y-4">
          <h2 className="text-[14px] font-semibold text-zinc-900">참여 기업 · 평가 결과</h2>
          {perStartup.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-dashed border-zinc-300 text-center text-[13px] text-zinc-500">
              아직 참여 기업이 없습니다.
            </div>
          ) : (
            perStartup.map((p) => (
              <div key={p.startup.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {p.startup.pitchTime ? (
                        <span className="text-[11px] font-mono text-zinc-400">
                          {p.startup.pitchTime}
                        </span>
                      ) : null}
                      {p.startup.session ? (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                          {p.startup.session}
                        </span>
                      ) : null}
                      {p.startup.companyStage ? (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                          {p.startup.companyStage}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[16px] font-semibold text-zinc-900">
                      {p.startup.companyName}
                    </div>
                    {p.startup.companyTagline ? (
                      <div className="text-[12.5px] text-zinc-600 mt-0.5">
                        {p.startup.companyTagline}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider">
                      평균
                    </div>
                    <div className="text-[24px] font-bold tabular-nums text-zinc-900 leading-none">
                      {p.averageScore > 0 ? p.averageScore.toFixed(1) : "—"}
                      <span className="text-[11.5px] text-zinc-400 font-normal">/5</span>
                    </div>
                    <div className="text-[10.5px] text-zinc-500 mt-0.5">
                      {p.submissionCount}명 평가
                    </div>
                  </div>
                </div>

                {p.submissionCount > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-zinc-100">
                      {SCORE_KEYS.map((dim) => {
                        const score = p.scoreByDimension[dim.key];
                        return (
                          <div key={dim.key} className="text-center">
                            <div className="text-[10.5px] text-zinc-500 font-medium mb-1">
                              {dim.label}
                            </div>
                            <div className="text-[15px] font-bold tabular-nums text-zinc-900">
                              {score > 0 ? score.toFixed(1) : "—"}
                            </div>
                            <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(score / 5) * 100}%`,
                                  background: "linear-gradient(90deg, #C74815, #E86B24)",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100">
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                        투자 판단 분포
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {(Object.keys(p.verdictCounts) as (keyof typeof p.verdictCounts)[]).map(
                          (v) => {
                            const cnt = p.verdictCounts[v];
                            if (cnt === 0) return null;
                            return (
                              <span
                                key={v}
                                className="inline-flex items-center gap-1 text-[11.5px] text-zinc-700"
                              >
                                <span className="font-semibold">{VERDICT_LABEL[v]}</span>
                                <span className="font-mono text-zinc-500">{cnt}</span>
                              </span>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-[12.5px] text-zinc-400">
                    아직 평가 없음
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* RIGHT: 심사역 명단 + 초청 폼 + 메모 */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-900">
                  초청 심사역 · {invites.length}명
                </h3>
              </div>
            </div>
            {invites.length === 0 ? (
              <div className="text-[12px] text-zinc-500 text-center py-4">
                아래에서 심사역을 초청해 주세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {invites.map((inv) => {
                  const submitted = !pendingReviewerIds.has(inv.reviewerId);
                  const url = `/demoday/j/${inv.token}`;
                  return (
                    <div
                      key={inv.id}
                      className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-b-0"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5 ${
                          submitted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {submitted ? "✓" : inv.reviewer.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-zinc-900">
                          {inv.reviewer.name}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {inv.reviewer.organization}
                          {inv.reviewer.role ? ` · ${inv.reviewer.role}` : ""}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <CopyButton text={`${origin}${url}`} />
                          <Link
                            href={url}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                          >
                            <ExternalLink className="w-3 h-3" />
                            열기
                          </Link>
                          {submitted ? (
                            <span className="text-[10.5px] text-emerald-700 font-medium">
                              제출 완료
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-zinc-400">미제출</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <InvitePanel
            roundId={round.id}
            companyIds={companyIds}
            currentInvitedIds={currentInvitedIds}
          />

          {round.notes ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                운영 메모
              </h3>
              <p className="text-[12.5px] text-zinc-700 leading-relaxed whitespace-pre-line">
                {round.notes}
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
      <div className="text-[13.5px] text-zinc-900 font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

