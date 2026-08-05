/**
 * 데모데이 서버 사이드 검증 (스펙 §6 마지막 문단).
 * 클라이언트 검증만 믿지 말 것 — API 라우트에서 이걸 반드시 호출.
 */

import type { SubmissionInput, Verdict } from "./types";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const VERDICTS: readonly Verdict[] = [
  "interested",
  "additional_review",
  "hold",
  "reject",
  "undecided",
];

const isInt1to5 = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;

const isVerdict = (v: unknown): v is Verdict =>
  typeof v === "string" && (VERDICTS as readonly string[]).includes(v);

const clampText = (v: unknown, maxLen = 2000): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > maxLen ? t.substring(0, maxLen) : t;
};

/**
 * 심사역 세션 payload에서 검증한 (roundId, reviewerId, startupId) 를 넣어야 안전.
 * 클라이언트가 보낸 IDs 는 이 함수 밖에서 세션 검증 후 신뢰.
 */
export function validateSubmissionInput(raw: unknown): ValidationResult<SubmissionInput> {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["요청 본문이 비어있습니다"] };
  }
  const r = raw as Record<string, unknown>;

  const roundId = typeof r.roundId === "string" ? r.roundId : "";
  const startupId = typeof r.startupId === "string" ? r.startupId : "";
  const reviewerId = typeof r.reviewerId === "string" ? r.reviewerId : "";

  if (!roundId) errors.push("roundId 누락");
  if (!startupId) errors.push("startupId 누락");
  if (!reviewerId) errors.push("reviewerId 누락");

  const scoresRaw = r.scores;
  if (!scoresRaw || typeof scoresRaw !== "object") {
    errors.push("scores 누락");
  } else {
    const s = scoresRaw as Record<string, unknown>;
    if (!isInt1to5(s.team)) errors.push("team 점수는 1~5 정수");
    if (!isInt1to5(s.market)) errors.push("market 점수는 1~5 정수");
    if (!isInt1to5(s.tech)) errors.push("tech 점수는 1~5 정수");
    if (!isInt1to5(s.bm)) errors.push("bm 점수는 1~5 정수");
  }

  if (!isVerdict(r.verdict)) {
    errors.push(`verdict 는 ${VERDICTS.join("/")} 중 하나`);
  }

  if (errors.length > 0) return { ok: false, errors };

  const scoresIn = scoresRaw as Record<string, number>;
  const value: SubmissionInput = {
    roundId,
    startupId,
    reviewerId,
    scores: {
      team: scoresIn.team,
      market: scoresIn.market,
      tech: scoresIn.tech,
      bm: scoresIn.bm,
    },
    strengths: clampText(r.strengths),
    concerns: clampText(r.concerns),
    requests: clampText(r.requests),
    verdict: r.verdict as Verdict,
  };
  return { ok: true, value };
}

/** 랜덤 토큰 생성 (64자 hex = 32바이트) */
export function generateInviteToken(): string {
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.randomBytes(32).toString("hex");
}
