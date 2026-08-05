import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/demoday/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

type ConflictItem = {
  companyId: number;
  companyName: string;
  roundTitle: string;
  roundDate: string;
  source: "submission" | "invite";
};

/**
 * GET /api/admin/demoday/conflicts?reviewerIds=<a,b>&companyIds=<1,2>
 * → 각 심사역이 과거에 (제출했거나 초청됐던) 대상 companyId 들을 반환.
 *   반환 shape: { [reviewerId]: ConflictItem[] }
 *   companyIds 가 있으면 필터링(현재 라운드 후보 회사와 겹치는 것만).
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const sp = request.nextUrl.searchParams;
    const reviewerIds = (sp.get("reviewerIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const companyIdsRaw = (sp.get("companyIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const companyIds = companyIdsRaw
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));

    if (reviewerIds.length === 0) return NextResponse.json({});

    const db = createAdminClient();

    // 1. 제출 이력에서 (reviewer × startup)
    const { data: subs, error: subsErr } = await db
      .from("demoday_submissions")
      .select(
        "reviewer_id, startup_id, demoday_startups!inner(company_id, companies!inner(id, name), demoday_rounds!inner(id, title, date))"
      )
      .in("reviewer_id", reviewerIds);
    if (subsErr) throw subsErr;

    // 2. 초청 이력에서 (reviewer × round × 그 회차의 startups)
    const { data: invites, error: invErr } = await db
      .from("demoday_reviewer_invites")
      .select(
        "reviewer_id, round_id, demoday_rounds!inner(id, title, date, demoday_startups(company_id, companies(id, name)))"
      )
      .in("reviewer_id", reviewerIds);
    if (invErr) throw invErr;

    const result: Record<string, ConflictItem[]> = {};
    for (const rid of reviewerIds) result[rid] = [];

    // 제출 이력
    for (const row of (subs ?? []) as unknown as Array<{
      reviewer_id: string;
      startup_id: string;
      demoday_startups: {
        company_id: number;
        companies: { id: number; name: string } | null;
        demoday_rounds: { id: string; title: string; date: string } | null;
      } | null;
    }>) {
      const st = row.demoday_startups;
      if (!st?.companies || !st?.demoday_rounds) continue;
      if (companyIds.length > 0 && !companyIds.includes(st.company_id)) continue;
      result[row.reviewer_id]?.push({
        companyId: st.company_id,
        companyName: st.companies.name,
        roundTitle: st.demoday_rounds.title,
        roundDate: st.demoday_rounds.date,
        source: "submission",
      });
    }

    // 초청 이력
    for (const row of (invites ?? []) as unknown as Array<{
      reviewer_id: string;
      round_id: string;
      demoday_rounds: {
        id: string;
        title: string;
        date: string;
        demoday_startups: {
          company_id: number;
          companies: { id: number; name: string } | null;
        }[];
      } | null;
    }>) {
      const round = row.demoday_rounds;
      if (!round) continue;
      for (const st of round.demoday_startups ?? []) {
        if (!st.companies) continue;
        if (companyIds.length > 0 && !companyIds.includes(st.company_id)) continue;
        // 중복 제거: 같은 (reviewer, company, round) 이미 있으면 skip
        const arr = result[row.reviewer_id] ?? [];
        const dupe = arr.some(
          (x) => x.companyId === st.company_id && x.roundTitle === round.title
        );
        if (dupe) continue;
        arr.push({
          companyId: st.company_id,
          companyName: st.companies.name,
          roundTitle: round.title,
          roundDate: round.date,
          source: "invite",
        });
        result[row.reviewer_id] = arr;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/demoday/conflicts] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
