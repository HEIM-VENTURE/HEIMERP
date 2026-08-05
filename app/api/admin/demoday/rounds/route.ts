import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { requireAdmin } from "@/lib/demoday/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const repo = getAdminRepository();
    const rounds = await repo.listRounds();
    return NextResponse.json(rounds);
  } catch (err) {
    console.error("[admin/demoday/rounds GET] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    if (!code || !title || !date) {
      return NextResponse.json(
        { error: "code, title, date 는 필수입니다" },
        { status: 400 }
      );
    }
    const repo = getAdminRepository();
    const round = await repo.createRound({
      code,
      title,
      date,
      timeRange: body.timeRange ?? null,
      zoomUrl: body.zoomUrl ?? null,
      notes: body.notes ?? null,
      status: body.status ?? "draft",
    });
    return NextResponse.json(round);
  } catch (err) {
    console.error("[admin/demoday/rounds POST] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
