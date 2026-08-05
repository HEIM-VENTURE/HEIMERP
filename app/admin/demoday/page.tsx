import Link from "next/link";
import { Video, Users, CalendarClock, Sparkles, Plus } from "lucide-react";
import {
  MOCK_DEMODAYS,
  STATUS_LABEL,
  STATUS_COLOR,
  calcAvgScore,
} from "@/lib/mock-demoday";

export const metadata = { title: "데모데이 · HEIM ERP" };

export default async function DemoDayListPage() {
  const upcoming = MOCK_DEMODAYS.filter(
    (d) => d.status === "scheduled" || d.status === "live" || d.status === "draft"
  );
  const past = MOCK_DEMODAYS.filter((d) => d.status === "completed");

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
            <Plus className="w-3.5 h-3.5" />
            새 데모데이
          </Link>
        </div>
      </div>

      {/* 예정 · 진행중 */}
      {upcoming.length > 0 ? (
        <div className="mb-8">
          <div className="text-[11.5px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            예정 · 진행 중
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map((d) => (
              <DemoDayCard key={d.id} demoday={d} />
            ))}
          </div>
        </div>
      ) : null}

      {/* 완료된 */}
      <div>
        <div className="text-[11.5px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          완료
        </div>
        <div className="space-y-3">
          {past.map((d) => (
            <PastDemoDayRow key={d.id} demoday={d} />
          ))}
        </div>
      </div>
    </>
  );
}

function DemoDayCard({ demoday }: { demoday: typeof MOCK_DEMODAYS[number] }) {
  const c = STATUS_COLOR[demoday.status];
  const submitted = demoday.evaluators.filter((e) => e.submitted).length;
  return (
    <Link
      href={`/admin/demoday/${demoday.id}`}
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
              {STATUS_LABEL[demoday.status]}
            </span>
            <span className="text-[11px] font-mono text-zinc-400">{demoday.code}</span>
          </div>
          <h3 className="text-[16px] font-semibold text-zinc-900">{demoday.title}</h3>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[12.5px] text-zinc-600 mb-4">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="w-3.5 h-3.5 text-zinc-400" />
          {demoday.date} · {demoday.time}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100">
        <MiniStat label="참여 기업" value={demoday.startups.length} />
        <MiniStat label="초청 심사역" value={demoday.evaluators.length} />
        <MiniStat
          label="제출 평가"
          value={`${submitted}/${demoday.evaluators.length}`}
        />
      </div>
    </Link>
  );
}

function PastDemoDayRow({ demoday }: { demoday: typeof MOCK_DEMODAYS[number] }) {
  const c = STATUS_COLOR[demoday.status];
  const submitted = demoday.evaluators.filter((e) => e.submitted).length;
  const avgScore = calcAvgScore(demoday.evaluations);
  return (
    <Link
      href={`/admin/demoday/${demoday.id}`}
      className="flex items-center gap-5 bg-white border border-zinc-200 rounded-xl p-4 hover:bg-zinc-50/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-medium rounded-full"
            style={{ background: c.bg, color: c.text }}
          >
            {STATUS_LABEL[demoday.status]}
          </span>
          <span className="text-[10.5px] font-mono text-zinc-400">{demoday.code}</span>
        </div>
        <div className="text-[13.5px] font-semibold text-zinc-900">{demoday.title}</div>
        <div className="text-[11.5px] text-zinc-500 mt-0.5">
          {demoday.date} · 참여 {demoday.startups.length}곳 · 심사역 {demoday.evaluators.length}명 · 평가 {submitted}건
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider">평균 점수</div>
        <div className="text-[20px] font-bold tabular-nums text-zinc-900">
          {avgScore > 0 ? avgScore.toFixed(1) : "—"}
          <span className="text-[11.5px] text-zinc-400 font-normal">/5</span>
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
