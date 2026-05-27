import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
  CONSULTING_STAGES_ORDER,
  PROGRAM_GRADE_LABELS,
  PROGRAM_GRADE_COLORS,
  SALES_STAGES_ORDER,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  stage?: string;
};

export default async function HvpCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const stage = sp.stage ?? "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("hvp_id")
    .eq("id", user.id)
    .single();

  if (!profile?.hvp_id) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">내 기업</h1>
        <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          HVP 정보가 연결되지 않았습니다. 관리자에게 문의하세요.
        </div>
      </div>
    );
  }

  let query = supabase
    .from("companies")
    .select("id, name, sales_stage, consulting_stage, program_grade, proposal_amount, fee_rate, address, main_item, received_at")
    .eq("hvp_id", profile.hvp_id)
    .order("received_at", { ascending: false });

  if (q) {
    const safe = q.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${safe}%,address.ilike.%${safe}%,main_item.ilike.%${safe}%`);
  }
  if (stage !== "all") {
    query = query.eq("sales_stage", stage);
  }

  const { data, error } = await query;
  const list = data ?? [];

  // 통계 (필터 무관 전체)
  const { data: allMine } = await supabase
    .from("companies")
    .select("id, sales_stage")
    .eq("hvp_id", profile.hvp_id);
  const all = allMine ?? [];

  const stageCounts = SALES_STAGES_ORDER.map((s) => ({
    key: s,
    label: SALES_STAGE_LABELS[s],
    count: all.filter((c) => c.sales_stage === s).length,
  }));

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">내 기업</h1>
          <p className="text-sm text-zinc-500 mt-1">전체 {all.length}개 · 내가 데려온 기업</p>
        </div>
        <Link href="/hvp/submit">
          <Button>+ 새 기업 접수</Button>
        </Link>
      </div>

      {/* 단계별 빠른 필터 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <Link
          href="/hvp/companies"
          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
            stage === "all"
              ? "bg-zinc-900 text-white"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          전체 {all.length}
        </Link>
        {stageCounts.map((s) => (
          <Link
            key={s.key}
            href={`/hvp/companies?stage=${s.key}`}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              stage === s.key
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {s.label} {s.count}
          </Link>
        ))}
      </div>

      {/* 검색 */}
      <form className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="회사명·아이템·소재지 검색…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          {stage !== "all" ? <input type="hidden" name="stage" value={stage} /> : null}
        </div>
      </form>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            {q || stage !== "all" ? "조건에 맞는 기업이 없습니다" : "아직 데려온 기업이 없습니다. + 새 기업 접수로 시작하세요"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">기업명</th>
                <th className="text-left px-4 py-3 font-medium w-28">단계</th>
                <th className="text-left px-4 py-3 font-medium w-44">컨설팅</th>
                <th className="text-left px-4 py-3 font-medium w-28">등급·금액</th>
                <th className="text-right px-4 py-3 font-medium w-28">내 수수료</th>
                <th className="text-left px-4 py-3 font-medium w-24">접수일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((c: any) => {
                const consultingIdx = c.consulting_stage
                  ? CONSULTING_STAGES_ORDER.indexOf(c.consulting_stage)
                  : -1;
                const consultingPct =
                  consultingIdx >= 0
                    ? Math.round(((consultingIdx + 1) / CONSULTING_STAGES_ORDER.length) * 100)
                    : 0;
                const myFee = c.proposal_amount
                  ? Math.round(Number(c.proposal_amount) * Number(c.fee_rate ?? 0.2))
                  : null;

                return (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/hvp/companies/${c.id}`} className="block">
                        <div className="font-medium text-zinc-900">{c.name}</div>
                        {c.main_item || c.address ? (
                          <div className="text-xs text-zinc-400 truncate">
                            {[c.main_item, c.address].filter(Boolean).join(" · ")}
                          </div>
                        ) : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${SALES_STAGE_COLORS[c.sales_stage as keyof typeof SALES_STAGE_COLORS]?.badge}`}>
                        {SALES_STAGE_LABELS[c.sales_stage as keyof typeof SALES_STAGE_LABELS]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.consulting_stage ? (
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-zinc-700 truncate">
                              {CONSULTING_STAGE_LABELS[c.consulting_stage as keyof typeof CONSULTING_STAGE_LABELS]}
                            </span>
                            <span className="text-zinc-400 ml-2 shrink-0">{consultingPct}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${consultingPct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.program_grade ? (
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded ${PROGRAM_GRADE_COLORS[c.program_grade as keyof typeof PROGRAM_GRADE_COLORS]}`}>
                            {PROGRAM_GRADE_LABELS[c.program_grade as keyof typeof PROGRAM_GRADE_LABELS]}
                          </span>
                          <div className="text-xs text-zinc-700 mt-0.5">
                            {c.proposal_amount ? `${Number(c.proposal_amount).toLocaleString()}만` : "—"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {myFee ? (
                        <span className="font-semibold text-zinc-900">{myFee.toLocaleString()}만</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{c.received_at}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
