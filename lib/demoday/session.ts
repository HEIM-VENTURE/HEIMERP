/**
 * 심사역 세션 쿠키 관리.
 * 스펙 §2-1: 기존 Supabase 인증과 쿠키 네임스페이스 완전 분리.
 *
 * 방식: HMAC-signed payload (외부 라이브러리 없이 node:crypto만)
 * 쿠키명: demoday-reviewer-session (기존 sb-*와 분리)
 */

import crypto from "node:crypto";
import type { ReviewerSession } from "./types";

const COOKIE_NAME = "demoday-reviewer-session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12시간

function getSecret(): string {
  const s = process.env.DEMODAY_TOKEN_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "DEMODAY_TOKEN_SECRET env var 없음. .env.local 에 32바이트 이상 랜덤 문자열 지정 필요."
    );
  }
  return s;
}

function sign(payload: string): string {
  const h = crypto.createHmac("sha256", getSecret());
  h.update(payload);
  return h.digest("hex");
}

/** 세션 페이로드 → 쿠키 값 (base64.hex_signature) */
export function serializeSession(session: ReviewerSession): string {
  const json = JSON.stringify(session);
  const b64 = Buffer.from(json, "utf-8").toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

/** 쿠키 값 → 세션 페이로드. 서명 검증 실패 or 만료 시 null */
export function parseSession(cookieValue: string | undefined): ReviewerSession | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  if (sign(b64) !== sig) return null;
  try {
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    const s = JSON.parse(json) as ReviewerSession;
    if (typeof s.reviewerId !== "string" || typeof s.roundId !== "string") return null;
    if (typeof s.issuedAt !== "number") return null;
    // TTL 체크 (issuedAt 은 Date.now() 못 쓰므로 실행 시점의 Date.now() 와 비교)
    // 참고: workflow 스크립트에선 Date.now() 금지지만 이 파일은 앱 런타임이라 OK
    if (Date.now() - s.issuedAt > SESSION_TTL_MS) return null;
    return s;
  } catch {
    return null;
  }
}

export const REVIEWER_COOKIE_NAME = COOKIE_NAME;
export const REVIEWER_SESSION_TTL_MS = SESSION_TTL_MS;
