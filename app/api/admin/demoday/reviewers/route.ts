import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { requireAdmin } from "@/lib/demoday/admin-guard";

/**
 * GET /api/admin/demoday/reviewers
 * → 모든 심사역 리스트
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const repo = getAdminRepository();
    const list = await repo.listReviewers();
    return NextResponse.json(list);
  } catch (err) {
    console.error("[admin/demoday/reviewers GET] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}

/**
 * POST /api/admin/demoday/reviewers
 * Body: Reviewer create input
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const organization = typeof body.organization === "string" ? body.organization.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!name || !organization || !email) {
      return NextResponse.json({ error: "name, organization, email 필수" }, { status: 400 });
    }
    const repo = getAdminRepository();
    const reviewer = await repo.createReviewer({
      name,
      organization,
      email,
      role: body.role ?? null,
      phone: body.phone ?? null,
      type: body.type ?? null,
      preferredIndustries: Array.isArray(body.preferredIndustries) ? body.preferredIndustries : [],
      notes: body.notes ?? null,
    });
    return NextResponse.json(reviewer);
  } catch (err) {
    console.error("[admin/demoday/reviewers POST] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
