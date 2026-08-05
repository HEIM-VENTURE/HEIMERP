import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { requireAdmin } from "@/lib/demoday/admin-guard";

/**
 * POST /api/admin/demoday/tokens
 * Body: { roundId: string, reviewerIds: string[] }
 * → 초청 upsert 후, 각 심사역별 { reviewerId, reviewerName, token, url } 반환.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await request.json().catch(() => ({}));
    const roundId = typeof body.roundId === "string" ? body.roundId : "";
    const reviewerIds: string[] = Array.isArray(body.reviewerIds)
      ? body.reviewerIds.filter((x: unknown): x is string => typeof x === "string")
      : [];
    if (!roundId || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: "roundId, reviewerIds 는 필수" },
        { status: 400 }
      );
    }
    const repo = getAdminRepository();
    const invites = await repo.createInvites({ roundId, reviewerIds });
    const base = request.nextUrl.origin;
    const items = invites.map((inv) => ({
      reviewerId: inv.reviewerId,
      reviewerName: inv.reviewer.name,
      reviewerOrganization: inv.reviewer.organization,
      token: inv.token,
      url: `${base}/demoday/j/${inv.token}`,
    }));
    return NextResponse.json(items);
  } catch (err) {
    console.error("[admin/demoday/tokens POST] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
