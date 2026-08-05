import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function StartupListPage({ params }: Props) {
  const { token } = await params;

  const repo = getAdminRepository();
  const payload = await repo.getSessionPayload(token).catch(() => null);
  if (!payload) redirect("/demoday/j/error");

  const { reviewer, round, startups, submissions } = payload;
  const submittedIds = new Set(submissions.map((s) => s.startupId));
  const total = startups.length;
  const done = submissions.length;

  // 대표자명 fetch (companies.ceo_name)
  const companyIds = Array.from(new Set(startups.map((s) => s.companyId)));
  const ceoMap: Record<number, string | null> = {};
  if (companyIds.length > 0) {
    const db = createAdminClient();
    const { data: cos } = await db
      .from("companies")
      .select("id, ceo_name")
      .in("id", companyIds);
    for (const c of (cos ?? []) as { id: number; ceo_name: string | null }[]) {
      ceoMap[c.id] = c.ceo_name;
    }
  }

  const sorted = [...startups].sort((a, b) => {
    // session 우선, pitchOrder 다음
    const sa = a.session ?? "";
    const sb = b.session ?? "";
    if (sa !== sb) return sa.localeCompare(sb);
    const oa = a.pitchOrder ?? 999;
    const ob = b.pitchOrder ?? 999;
    return oa - ob;
  });

  return (
    <div>
      {/* Intro */}
      <div className="mb-4">
        <div
          className="text-[10.5px] font-semibold uppercase mb-2"
          style={{ color: "#C74815" }}
        >
          Demo Day Evaluation
        </div>
        <h1
          className="text-[20px] font-bold leading-tight mb-1.5"
          style={{ color: "#1F2A36" }}
        >
          {reviewer.name} 심사역님, 환영합니다
        </h1>
        <p className="text-[13px] text-zinc-600 leading-relaxed">
          아래 {total}개 스타트업의 평가를 부탁드립니다. 각 회사 카드를 눌러 평가서를 작성해 주세요.
          제출한 후에도 언제든 수정할 수 있습니다.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-5 p-3.5 rounded-xl bg-white border border-zinc-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-medium text-zinc-700">진행 상황</div>
          <div className="text-[13px] font-bold tabular-nums text-zinc-900">
            {done}
            <span className="text-zinc-400 font-normal">/{total}</span>
          </div>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${total > 0 ? (done / total) * 100 : 0}%`,
              background: "linear-gradient(90deg, #C74815, #E86B24)",
            }}
          />
        </div>
        {done === total && total > 0 ? (
          <div className="mt-2 text-[11.5px] text-emerald-700 font-medium">
            ✓ 모든 평가가 제출되었습니다. 감사합니다.
          </div>
        ) : null}
      </div>

      {round.zoomUrl ? (
        <div className="mb-4">
          <a
            href={round.zoomUrl}
            target="_blank"
            rel="noopener"
            className="block text-center w-full h-11 leading-[44px] rounded-xl border text-[12.5px] font-medium text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Zoom 링크 열기 →
          </a>
        </div>
      ) : null}

      {/* Startup cards */}
      <div className="space-y-2.5">
        {sorted.map((s, i) => {
          const submitted = submittedIds.has(s.id);
          const ceo = ceoMap[s.companyId] ?? null;
          return (
            <Link
              key={s.id}
              href={`/demoday/j/${token}/${s.id}`}
              className="block p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 active:bg-zinc-50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${
                    submitted
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {submitted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {s.session ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                        {s.session}
                      </span>
                    ) : null}
                    {s.pitchTime ? (
                      <span className="text-[10.5px] font-mono text-zinc-400 inline-flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {s.pitchTime}
                      </span>
                    ) : null}
                    {submitted ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                        제출 완료
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[14.5px] font-semibold text-zinc-900 leading-tight">
                    {s.companyName}
                  </div>
                  <div className="text-[11.5px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {ceo ? <span>대표 {ceo}</span> : null}
                    {ceo && (s.companyTagline || s.companyStage) ? (
                      <span className="text-zinc-300">·</span>
                    ) : null}
                    {s.companyStage ? <span>{s.companyStage}</span> : null}
                  </div>
                  {s.companyTagline ? (
                    <div className="text-[12px] text-zinc-600 mt-1.5 line-clamp-2 leading-snug">
                      {s.companyTagline}
                    </div>
                  ) : null}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {done === total && total > 0 ? (
        <div className="mt-6">
          <Link
            href={`/demoday/j/${token}/complete`}
            className="block text-center w-full h-11 leading-[44px] rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors"
          >
            제출 완료 페이지로 →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
