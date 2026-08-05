/**
 * 데모데이 도메인 타입.
 * DB 스키마와 분리된 순수 도메인 모델.
 * Repository 인터페이스가 이 타입만 다룸.
 */

export type RoundStatus = "draft" | "scheduled" | "live" | "completed";

export type Verdict =
  | "interested"        // 관심
  | "additional_review" // 추가 검토
  | "hold"              // 보류
  | "reject"            // 거절
  | "undecided";        // 미정

export const VERDICT_LABEL: Record<Verdict, string> = {
  interested: "관심",
  additional_review: "추가 검토",
  hold: "보류",
  reject: "거절",
  undecided: "미정",
};

export type ReviewerType =
  | "vc"
  | "ac"
  | "corp"
  | "cvc"
  | "tech_holding"
  | "family_office"
  | "angel"
  | "etc";

export type Round = {
  id: string;
  code: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  timeRange: string | null;
  zoomUrl: string | null;
  status: RoundStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Startup = {
  id: string;
  roundId: string;
  companyId: number;
  companyName: string; // join된 값
  companyTagline: string | null;
  companyStage: string | null;
  session: string | null;
  pitchOrder: number | null;
  pitchTime: string | null;
  irDeckUrl: string | null;
};

export type Reviewer = {
  id: string;
  name: string;
  organization: string;
  role: string | null;
  email: string;
  phone: string | null;
  type: ReviewerType | null;
  preferredIndustries: string[];
};

export type ReviewerInvite = {
  id: string;
  roundId: string;
  reviewerId: string;
  reviewer: Reviewer;
  token: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type Submission = {
  id: string;
  roundId: string;
  startupId: string;
  reviewerId: string;
  scores: {
    team: number;
    market: number;
    tech: number;
    bm: number;
  };
  totalScore: number;
  strengths: string | null;
  concerns: string | null;
  requests: string | null;
  verdict: Verdict;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionInput = {
  roundId: string;
  startupId: string;
  reviewerId: string;
  scores: {
    team: number;
    market: number;
    tech: number;
    bm: number;
  };
  strengths?: string | null;
  concerns?: string | null;
  requests?: string | null;
  verdict: Verdict;
};

/** 심사역 세션 페이로드 (쿠키·JWT 안에 담김) */
export type ReviewerSession = {
  reviewerId: string;
  roundId: string;
  inviteToken: string;
  issuedAt: number; // epoch ms
};

/** 관리자용 회차 요약 */
export type RoundSummary = {
  round: Round;
  startupCount: number;
  reviewerCount: number;
  submissionCount: number;
  submissionRate: number; // 0-1
  pendingReviewers: Reviewer[]; // 미제출
  perStartup: {
    startup: Startup;
    submissionCount: number;
    averageScore: number;
    scoreByDimension: {
      team: number;
      market: number;
      tech: number;
      bm: number;
    };
    verdictCounts: Record<Verdict, number>;
  }[];
};

/** 랜딩 세션 초기 로드 페이로드 (심사역이 토큰으로 접속 시) */
export type SessionPayload = {
  reviewer: Reviewer;
  round: Round;
  startups: Startup[];
  submissions: Submission[]; // 본인이 이미 제출한 것
};
