/**
 * JudgingRepository — 데모데이 심사 데이터 접근 인터페이스.
 * 화면·라우트 코드는 이 인터페이스만 참조. 어댑터는 lib/demoday/supabase-repo.ts.
 * 스펙 §2-2에 따라 나중에 다른 백엔드(예: 별도 서비스)로 교체 가능.
 */

import type {
  Round,
  Startup,
  Reviewer,
  ReviewerInvite,
  Submission,
  SubmissionInput,
  SessionPayload,
  RoundSummary,
  RoundStatus,
} from "./types";

export interface JudgingRepository {
  // ─── Rounds ─────────────────────────
  listRounds(opts?: { status?: RoundStatus[]; limit?: number }): Promise<Round[]>;
  getRoundById(id: string): Promise<Round | null>;
  getRoundByDate(date: string): Promise<Round | null>;
  createRound(input: {
    code: string;
    title: string;
    date: string;
    timeRange?: string | null;
    zoomUrl?: string | null;
    status?: RoundStatus;
    notes?: string | null;
  }): Promise<Round>;
  updateRound(id: string, patch: Partial<Round>): Promise<Round>;

  // ─── Startups (round 참여) ─────────────
  listStartupsInRound(roundId: string): Promise<Startup[]>;
  addStartupToRound(input: {
    roundId: string;
    companyId: number;
    session?: string | null;
    pitchOrder?: number | null;
    pitchTime?: string | null;
    irDeckUrl?: string | null;
  }): Promise<Startup>;
  removeStartupFromRound(startupId: string): Promise<void>;

  // ─── Reviewers ──────────────────────
  listReviewers(): Promise<Reviewer[]>;
  getReviewerById(id: string): Promise<Reviewer | null>;
  createReviewer(input: Omit<Reviewer, "id"> & { notes?: string | null }): Promise<Reviewer>;

  // ─── Invites (round × reviewer + token) ──
  listInvites(roundId: string): Promise<ReviewerInvite[]>;
  getInviteByToken(token: string): Promise<ReviewerInvite | null>;
  createInvites(input: {
    roundId: string;
    reviewerIds: string[];
    expiresAt?: string | null;
  }): Promise<ReviewerInvite[]>;
  revokeInvite(inviteId: string): Promise<void>;

  // ─── Submissions ─────────────────────
  listSubmissionsForReviewer(roundId: string, reviewerId: string): Promise<Submission[]>;
  listSubmissionsForRound(roundId: string): Promise<Submission[]>;
  getSubmission(roundId: string, startupId: string, reviewerId: string): Promise<Submission | null>;
  /**
   * 스펙 §7-1: 재제출은 새 행이 아니라 기존 행 갱신.
   * DB의 UNIQUE(round_id, startup_id, reviewer_id) + upsert 로 처리.
   */
  upsertSubmission(input: SubmissionInput): Promise<Submission>;

  // ─── Composite (편의 메서드) ──────────
  /** 심사역이 토큰으로 접속 시 초기 페이로드 (round + startups + own submissions) */
  getSessionPayload(token: string): Promise<SessionPayload | null>;
  /** 관리자 회차 요약 */
  getRoundSummary(roundId: string): Promise<RoundSummary | null>;
}
