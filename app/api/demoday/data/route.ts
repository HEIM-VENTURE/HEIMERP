import { NextRequest, NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { getReviewerSession } from "@/lib/demoday/api-session";

/**
 * GET /api/demoday/data
 * 심사역 세션 쿠키를 검증하고 SessionPayload 를 반환.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getReviewerSession(request);
    if (!session) {
      return NextResponse.json({ error: "세션이 만료되었습니다" }, { status: 401 });
    }
    const repo = getAdminRepository();
    const payload = await repo.getSessionPayload(session.inviteToken);
    if (!payload) {
      return NextResponse.json({ error: "세션 정보를 찾을 수 없습니다" }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[demoday/data] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
