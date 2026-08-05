import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { requireAdmin } from "@/lib/demoday/admin-guard";

/**
 * POST /api/admin/demoday/startups
 * Body: { roundId, companyId, session?, pitchOrder?, pitchTime?, irDeckUrl? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await request.json().catch(() => ({}));
    const roundId = typeof body.roundId === "string" ? body.roundId : "";
    const companyId = typeof body.companyId === "number" ? body.companyId : NaN;
    if (!roundId || !Number.isFinite(companyId)) {
      return NextResponse.json({ error: "roundId, companyId 필수" }, { status: 400 });
    }
    const repo = getAdminRepository();
    const startup = await repo.addStartupToRound({
      roundId,
      companyId,
      session: body.session ?? null,
      pitchOrder: typeof body.pitchOrder === "number" ? body.pitchOrder : null,
      pitchTime: body.pitchTime ?? null,
      irDeckUrl: body.irDeckUrl ?? null,
    });
    return NextResponse.json(startup);
  } catch (err) {
    console.error("[admin/demoday/startups POST] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/demoday/startups?id=<startupId>
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });
    const repo = getAdminRepository();
    await repo.removeStartupFromRound(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/demoday/startups DELETE] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
