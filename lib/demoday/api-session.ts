/**
 * API 라우트에서 사용할 심사역 세션 헬퍼.
 * lib/demoday/session.ts 의 serialize/parse 를 기반으로,
 * Next.js Request/Response 쿠키 API 로 wrap.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  serializeSession,
  parseSession,
  REVIEWER_COOKIE_NAME,
  REVIEWER_SESSION_TTL_MS,
} from "./session";
import type { ReviewerSession } from "./types";

export function setReviewerSession(
  response: NextResponse,
  session: ReviewerSession
): NextResponse {
  const value = serializeSession(session);
  response.cookies.set(REVIEWER_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(REVIEWER_SESSION_TTL_MS / 1000),
  });
  return response;
}

export function getReviewerSession(request: NextRequest): ReviewerSession | null {
  const cookie = request.cookies.get(REVIEWER_COOKIE_NAME);
  return parseSession(cookie?.value);
}

export function clearReviewerSession(response: NextResponse): NextResponse {
  response.cookies.delete(REVIEWER_COOKIE_NAME);
  return response;
}

/** Server component 에서 쿠키로부터 세션 읽기 */
export async function getReviewerSessionFromCookies(): Promise<ReviewerSession | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const c = store.get(REVIEWER_COOKIE_NAME);
  return parseSession(c?.value);
}

/** Server component 에서 쿠키에 세션 세팅 */
export async function setReviewerSessionInCookies(
  session: ReviewerSession
): Promise<void> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const value = serializeSession(session);
  store.set(REVIEWER_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(REVIEWER_SESSION_TTL_MS / 1000),
  });
}
