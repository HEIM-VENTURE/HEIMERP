import Link from "next/link";
import { CalendarClock, Plus, Video } from "lucide-react";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import type { Round, RoundStatus } from "@/lib/demoday/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "데모데이 · HEIM ERP" };

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

export default async function DemoDayListPage() {
  let rounds: Round[] = [];
  let loadError: string | null = null;
  try {
    const repo = getAdminRepository();
    rounds = await repo.listRounds();
  } catch (err) {
    console.error("[admin/demoday list] error", err);
    loadError = "데모데이 회차를 불러오지 못했습니다. DB 마이그레이션 적용 여부를 확인해 주세요.";
  }

  // 회차별 요약 병렬 조회 (참여 스타트업/심사역/제출)
  const summaries = await Promise.all(
    rounds.map(async (r) => {
      try {
        const repo = getAdminRepository();
        const s = await repo.getRoundSummary(r.id);
        return {
          roundId: r.id,
          startupCount: s?.startupCount ?? 0,
          reviewerCount: s?.reviewerCount ?? 0,
          submissionCount: s?.submissionCount ?? 0,
        };
      } catch {
        return {
          roundId: r.id,
          startupCount: 0,
          reviewerCount: 0,
          submissionCount: 0,
        };
      }
    })
  );
  const summaryMap = new Map(summaries.map((s) => [s.roundId, s]));

  const upcoming = rounds.filter(
    (d) => d.status === "scheduled" || d.status === "live" || d.status === "draft"
  );
  const past = rounds.filter((d) => d.status === "completed");

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">데모데이</h1>
          <p className="text-sm text-zinc-500 mt-1">
            매주 TIPS·LIPS 심사역 대상 데모데이 · 평가 취합 · 대표 피드백 관리.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/demoday/new"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand text-white text-[12.5px] font-medium hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />새 데모데이
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
          {loadError}
        </div>
      ) : null}

      {rounds.length === 0 && !loadError ? (
        <div className="p-10 rounded-2xl bg-white border border-dashed border-zinc-300 text-center">
          <div className="text-[14px] font-semibold text-zinc-900 mb-1">아직 데모데이가 없습니다</div>
          <div className="text-[12.5px] text-zinc-500 mb-4">
            우측 상단 [새 데모데이] 버튼으로 첫 회차를 만들어 주세요.
          </div>
          <Link
            href="/admin/demoday/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-white text-[12.5px] font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            새 데모데이 만들기
          </Link>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <div className="mb-8">
          <div className="text-[11.5px] font-semibold text-zinc-500 uppercase mb-3">
            예정 · 진행 중
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map((d) => (
              <DemoDayCard
                key={d.id}
                round={d}
                summary={summaryMap.get(d.id) ?? { startupCount: 0, reviewerCount: 0, submissionCount: 0 }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {past.length > 0 ? (
        <div>
          <div className="text-[11.5px] font-semibold text-zinc-500 uppercase mb-3">
            완료
          </div>
          <div className="space-y-3">
            {past.map((d) => (
              <PastDemoDayRow
                key={d.id}
                round={d}
                summary={summaryMap.get(d.id) ?? { startupCount: 0, reviewerCount: 0, submissionCount: 0 }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

type MiniSummary = { startupCount: number; reviewerCount: number; submissionCount: number };

function DemoDayCard({ round, summary }: { round: Round; summary: MiniSummary }) {
  const c = STATUS_COLOR[round.status];
  return (
    <Link
      href={`/admin/demoday/${round.id}`}
      className="block bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full"
              style={{ background: c.bg, color: c.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
              {STATUS_LABEL[round.status]}
            </span>
            <span className="text-[11px] font-mono text-zinc-400">{round.code}</span>
          </div>
          <h3 className="text-[16px] font-semibold text-zinc-900">{round.title}</h3>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[12.5px] text-zinc-600 mb-4">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="w-3.5 h-3.5 text-zinc-400" />
          {round.date}
          {round.timeRange ? ` · ${round.timeRange}` : ""}
        </span>
        {round.zoomUrl ? (
          <span className="inline-flex items-center gap-1 text-zinc-500">
            <Video className="w-3.5 h-3.5" />
            Zoom
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100">
        <MiniStat label="참여 기업" value={summary.startupCount} />
        <MiniStat label="초청 심사역" value={summary.reviewerCount} />
        <MiniStat label="제출 평가" value={summary.submissionCount} />
      </div>
    </Link>
  );
}

function PastDemoDayRow({ round, summary }: { round: Round; summary: MiniSummary }) {
  const c = STATUS_COLOR[round.status];
  return (
    <Link
      href={`/admin/demoday/${round.id}`}
      className="flex items-center gap-5 bg-white border border-zinc-200 rounded-xl p-4 hover:bg-zinc-50/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-medium rounded-full"
            style={{ background: c.bg, color: c.text }}
          >
            {STATUS_LABEL[round.status]}
          </span>
          <span className="text-[10.5px] font-mono text-zinc-400">{round.code}</span>
        </div>
        <div className="text-[13.5px] font-semibold text-zinc-900">{round.title}</div>
        <div className="text-[11.5px] text-zinc-500 mt-0.5">
          {round.date} · 참여 {summary.startupCount}곳 · 심사역 {summary.reviewerCount}명 · 평가 {summary.submissionCount}건
        </div>
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10.5px] text-zinc-500 font-medium">{label}</div>
      <div className="text-[15px] font-bold text-zinc-900 tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
