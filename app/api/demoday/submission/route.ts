import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { getReviewerSession } from "@/lib/demoday/api-session";
import { validateSubmissionInput } from "@/lib/demoday/validation";

/**
 * GET /api/demoday/submission?startupId=<id>
 * → 현재 세션의 심사역이 해당 스타트업에 대해 이미 제출한 Submission (없으면 null)
 */
export async function GET(request: NextRequest) {
  try {
    const session = getReviewerSession(request);
    if (!session) {
      return NextResponse.json({ error: "세션이 만료되었습니다" }, { status: 401 });
    }
    const startupId = request.nextUrl.searchParams.get("startupId");
    if (!startupId) {
      return NextResponse.json({ error: "startupId 필요" }, { status: 400 });
    }
    const repo = getAdminRepository();
    const sub = await repo.getSubmission(session.roundId, startupId, session.reviewerId);
    return NextResponse.json(sub);
  } catch (err) {
    console.error("[demoday/submission GET] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}

/**
 * POST /api/demoday/submission
 * Body: { startupId, scores: {team,market,tech,bm}, strengths?, concerns?, requests?, verdict }
 * → 심사역 세션에서 roundId/reviewerId 를 채워 upsert.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getReviewerSession(request);
    if (!session) {
      return NextResponse.json({ error: "세션이 만료되었습니다" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const merged = {
      ...body,
      roundId: session.roundId,
      reviewerId: session.reviewerId,
    };
    const validation = validateSubmissionInput(merged);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }
    const repo = getAdminRepository();
    const sub = await repo.upsertSubmission(validation.value);
    return NextResponse.json(sub);
  } catch (err) {
    console.error("[demoday/submission POST] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
