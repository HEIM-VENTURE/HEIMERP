import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { requireAdmin } from "@/lib/demoday/admin-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const roundId = request.nextUrl.searchParams.get("roundId");
    if (!roundId) {
      return NextResponse.json({ error: "roundId 필요" }, { status: 400 });
    }
    const repo = getAdminRepository();
    const summary = await repo.getRoundSummary(roundId);
    if (!summary) {
      return NextResponse.json({ error: "회차를 찾을 수 없습니다" }, { status: 404 });
    }
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[admin/demoday/summary] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
