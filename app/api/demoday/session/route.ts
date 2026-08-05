import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { setReviewerSession } from "@/lib/demoday/api-session";

/**
 * POST /api/demoday/session
 * Body: { token: string }
 * → 유효한 초청 토큰이면 심사역 세션 쿠키 설정 후 { reviewer, round } 반환.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = body && typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "토큰이 필요합니다" }, { status: 400 });
    }
    const repo = getAdminRepository();
    const invite = await repo.getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: "유효하지 않은 링크입니다" }, { status: 404 });
    }
    const round = await repo.getRoundById(invite.roundId);
    if (!round) {
      return NextResponse.json({ error: "회차 정보를 찾을 수 없습니다" }, { status: 404 });
    }
    const response = NextResponse.json({ reviewer: invite.reviewer, round });
    setReviewerSession(response, {
      reviewerId: invite.reviewerId,
      roundId: invite.roundId,
      inviteToken: invite.token,
      issuedAt: Date.now(),
    });
    return response;
  } catch (err) {
    console.error("[demoday/session] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
