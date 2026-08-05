import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { requireAdmin } from "@/lib/demoday/admin-guard";
import type { Round } from "@/lib/demoday/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const patch: Partial<Round> = {};
    if (typeof body.code === "string") patch.code = body.code;
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.date === "string") patch.date = body.date;
    if ("timeRange" in body) patch.timeRange = body.timeRange ?? null;
    if ("zoomUrl" in body) patch.zoomUrl = body.zoomUrl ?? null;
    if ("notes" in body) patch.notes = body.notes ?? null;
    if (
      typeof body.status === "string" &&
      ["draft", "scheduled", "live", "completed"].includes(body.status)
    ) {
      patch.status = body.status;
    }
    const repo = getAdminRepository();
    const round = await repo.updateRound(id, patch);
    return NextResponse.json(round);
  } catch (err) {
    console.error("[admin/demoday/rounds PATCH] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const { id } = await params;
    const repo = getAdminRepository();
    await repo.deleteRound(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/demoday/rounds DELETE] error", err);
    return NextResponse.json({ error: "회차 삭제에 실패했습니다" }, { status: 500 });
  }
}
