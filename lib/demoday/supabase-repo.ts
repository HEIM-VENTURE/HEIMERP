/**
 * SupabaseJudgingRepository — Supabase 어댑터 구현.
 * JudgingRepository 인터페이스의 모든 메서드를 Supabase 쿼리로 구현.
 *
 * 두 종류의 클라이언트 사용:
 *   - adminClient: SUPABASE_SERVICE_ROLE_KEY 로 RLS 우회 (관리자 API + 심사역 토큰 검증 후)
 *   - readClient: anon key (일반 관리자 세션에서 RLS 통과)
 * 이 파일은 항상 adminClient 사용 (권한 검증은 상위 API 라우트에서 이미 통과했다고 가정).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { JudgingRepository } from "./repository";
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
  Verdict,
  ReviewerType,
} from "./types";
import { generateInviteToken } from "./validation";

// ─────────────────────────────────────────────
// Row 타입 (DB 컬럼 그대로)
// ─────────────────────────────────────────────
type RoundRow = {
  id: string;
  code: string;
  title: string;
  date: string;
  time_range: string | null;
  zoom_url: string | null;
  status: RoundStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type StartupRow = {
  id: string;
  round_id: string;
  company_id: number;
  session: string | null;
  pitch_order: number | null;
  pitch_time: string | null;
  ir_deck_url: string | null;
  companies?: {
    id: number;
    name: string;
    main_item: string | null;
    sales_stage: string | null;
    consulting_stage: string | null;
  } | null;
};

type ReviewerRow = {
  id: string;
  name: string;
  organization: string;
  role: string | null;
  email: string;
  phone: string | null;
  type: ReviewerType | null;
  preferred_industries: string[] | null;
};

type InviteRow = {
  id: string;
  round_id: string;
  reviewer_id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  demoday_reviewers?: ReviewerRow | null;
};

type SubmissionRow = {
  id: string;
  round_id: string;
  startup_id: string;
  reviewer_id: string;
  score_team: number;
  score_market: number;
  score_tech: number;
  score_bm: number;
  total_score: number;
  strengths: string | null;
  concerns: string | null;
  requests: string | null;
  verdict: Verdict;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────
// Row → Domain 매핑
// ─────────────────────────────────────────────
function toRound(r: RoundRow): Round {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    date: r.date,
    timeRange: r.time_range,
    zoomUrl: r.zoom_url,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toStartup(r: StartupRow): Startup {
  const co = r.companies;
  return {
    id: r.id,
    roundId: r.round_id,
    companyId: r.company_id,
    companyName: co?.name ?? "(회사 정보 없음)",
    companyTagline: co?.main_item ?? null,
    companyStage: co?.consulting_stage ?? co?.sales_stage ?? null,
    session: r.session,
    pitchOrder: r.pitch_order,
    pitchTime: r.pitch_time,
    irDeckUrl: r.ir_deck_url,
  };
}

function toReviewer(r: ReviewerRow): Reviewer {
  return {
    id: r.id,
    name: r.name,
    organization: r.organization,
    role: r.role,
    email: r.email,
    phone: r.phone,
    type: r.type,
    preferredIndustries: r.preferred_industries ?? [],
  };
}

function toInvite(r: InviteRow): ReviewerInvite {
  if (!r.demoday_reviewers) {
    throw new Error(`Invite ${r.id} 에 reviewer join 실패`);
  }
  return {
    id: r.id,
    roundId: r.round_id,
    reviewerId: r.reviewer_id,
    reviewer: toReviewer(r.demoday_reviewers),
    token: r.token,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    revokedAt: r.revoked_at,
  };
}

function toSubmission(r: SubmissionRow): Submission {
  return {
    id: r.id,
    roundId: r.round_id,
    startupId: r.startup_id,
    reviewerId: r.reviewer_id,
    scores: {
      team: r.score_team,
      market: r.score_market,
      tech: r.score_tech,
      bm: r.score_bm,
    },
    totalScore: r.total_score,
    strengths: r.strengths,
    concerns: r.concerns,
    requests: r.requests,
    verdict: r.verdict,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ─────────────────────────────────────────────
// Repository 구현
// ─────────────────────────────────────────────
export class SupabaseJudgingRepository implements JudgingRepository {
  constructor(private readonly db: SupabaseClient) {}

  // ─── Rounds ─────────────────────────
  async listRounds(opts?: { status?: RoundStatus[]; limit?: number }): Promise<Round[]> {
    let q = this.db.from("demoday_rounds").select("*").order("date", { ascending: false });
    if (opts?.status) q = q.in("status", opts.status);
    if (opts?.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data as RoundRow[]).map(toRound);
  }

  async getRoundById(id: string): Promise<Round | null> {
    const { data, error } = await this.db.from("demoday_rounds").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toRound(data as RoundRow) : null;
  }

  async getRoundByDate(date: string): Promise<Round | null> {
    const { data, error } = await this.db
      .from("demoday_rounds")
      .select("*")
      .eq("date", date)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toRound(data as RoundRow) : null;
  }

  async createRound(input: {
    code: string;
    title: string;
    date: string;
    timeRange?: string | null;
    zoomUrl?: string | null;
    status?: RoundStatus;
    notes?: string | null;
  }): Promise<Round> {
    const { data, error } = await this.db
      .from("demoday_rounds")
      .insert({
        code: input.code,
        title: input.title,
        date: input.date,
        time_range: input.timeRange ?? null,
        zoom_url: input.zoomUrl ?? null,
        status: input.status ?? "draft",
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toRound(data as RoundRow);
  }

  async updateRound(id: string, patch: Partial<Round>): Promise<Round> {
    const dbPatch: Partial<RoundRow> = {};
    if (patch.code !== undefined) dbPatch.code = patch.code;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.timeRange !== undefined) dbPatch.time_range = patch.timeRange;
    if (patch.zoomUrl !== undefined) dbPatch.zoom_url = patch.zoomUrl;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    const { data, error } = await this.db
      .from("demoday_rounds")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toRound(data as RoundRow);
  }

  // ─── Startups ──────────────────────
  async listStartupsInRound(roundId: string): Promise<Startup[]> {
    const { data, error } = await this.db
      .from("demoday_startups")
      .select("*, companies(id, name, main_item, sales_stage, consulting_stage)")
      .eq("round_id", roundId)
      .order("pitch_order", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data as StartupRow[]).map(toStartup);
  }

  async addStartupToRound(input: {
    roundId: string;
    companyId: number;
    session?: string | null;
    pitchOrder?: number | null;
    pitchTime?: string | null;
    irDeckUrl?: string | null;
  }): Promise<Startup> {
    const { data, error } = await this.db
      .from("demoday_startups")
      .insert({
        round_id: input.roundId,
        company_id: input.companyId,
        session: input.session ?? null,
        pitch_order: input.pitchOrder ?? null,
        pitch_time: input.pitchTime ?? null,
        ir_deck_url: input.irDeckUrl ?? null,
      })
      .select("*, companies(id, name, main_item, sales_stage, consulting_stage)")
      .single();
    if (error) throw error;
    return toStartup(data as StartupRow);
  }

  async removeStartupFromRound(startupId: string): Promise<void> {
    const { error } = await this.db.from("demoday_startups").delete().eq("id", startupId);
    if (error) throw error;
  }

  // ─── Reviewers ────────────────────
  async listReviewers(): Promise<Reviewer[]> {
    const { data, error } = await this.db
      .from("demoday_reviewers")
      .select("*")
      .order("organization", { ascending: true });
    if (error) throw error;
    return (data as ReviewerRow[]).map(toReviewer);
  }

  async getReviewerById(id: string): Promise<Reviewer | null> {
    const { data, error } = await this.db
      .from("demoday_reviewers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toReviewer(data as ReviewerRow) : null;
  }

  async createReviewer(input: Omit<Reviewer, "id"> & { notes?: string | null }): Promise<Reviewer> {
    const { data, error } = await this.db
      .from("demoday_reviewers")
      .insert({
        name: input.name,
        organization: input.organization,
        role: input.role,
        email: input.email,
        phone: input.phone,
        type: input.type,
        preferred_industries: input.preferredIndustries,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toReviewer(data as ReviewerRow);
  }

  // ─── Invites ─────────────────────
  async listInvites(roundId: string): Promise<ReviewerInvite[]> {
    const { data, error } = await this.db
      .from("demoday_reviewer_invites")
      .select("*, demoday_reviewers(*)")
      .eq("round_id", roundId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as InviteRow[]).map(toInvite);
  }

  async getInviteByToken(token: string): Promise<ReviewerInvite | null> {
    const { data, error } = await this.db
      .from("demoday_reviewer_invites")
      .select("*, demoday_reviewers(*)")
      .eq("token", token)
      .is("revoked_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    // 만료 체크
    const row = data as InviteRow;
    if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
    return toInvite(row);
  }

  async createInvites(input: {
    roundId: string;
    reviewerIds: string[];
    expiresAt?: string | null;
  }): Promise<ReviewerInvite[]> {
    if (input.reviewerIds.length === 0) return [];
    // 이미 초청된 (round, reviewer) 는 skip — DB의 UNIQUE 제약이 막음
    // upsert로 처리해서 기존 것 재활용
    const rows = input.reviewerIds.map((rid) => ({
      round_id: input.roundId,
      reviewer_id: rid,
      token: generateInviteToken(),
      expires_at: input.expiresAt ?? null,
    }));
    const { data, error } = await this.db
      .from("demoday_reviewer_invites")
      .upsert(rows, { onConflict: "round_id,reviewer_id", ignoreDuplicates: false })
      .select("*, demoday_reviewers(*)");
    if (error) throw error;
    return (data as InviteRow[]).map(toInvite);
  }

  async revokeInvite(inviteId: string): Promise<void> {
    const { error } = await this.db
      .from("demoday_reviewer_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", inviteId);
    if (error) throw error;
  }

  // ─── Submissions ────────────────
  async listSubmissionsForReviewer(roundId: string, reviewerId: string): Promise<Submission[]> {
    const { data, error } = await this.db
      .from("demoday_submissions")
      .select("*")
      .eq("round_id", roundId)
      .eq("reviewer_id", reviewerId);
    if (error) throw error;
    return (data as SubmissionRow[]).map(toSubmission);
  }

  async listSubmissionsForRound(roundId: string): Promise<Submission[]> {
    const { data, error } = await this.db
      .from("demoday_submissions")
      .select("*")
      .eq("round_id", roundId);
    if (error) throw error;
    return (data as SubmissionRow[]).map(toSubmission);
  }

  async getSubmission(roundId: string, startupId: string, reviewerId: string): Promise<Submission | null> {
    const { data, error } = await this.db
      .from("demoday_submissions")
      .select("*")
      .eq("round_id", roundId)
      .eq("startup_id", startupId)
      .eq("reviewer_id", reviewerId)
      .maybeSingle();
    if (error) throw error;
    return data ? toSubmission(data as SubmissionRow) : null;
  }

  /**
   * 스펙 §7-1 준수: UNIQUE(round_id, startup_id, reviewer_id) 위에서 upsert.
   * 같은 심사역의 재제출 = UPDATE (새 행 X).
   */
  async upsertSubmission(input: SubmissionInput): Promise<Submission> {
    const { data, error } = await this.db
      .from("demoday_submissions")
      .upsert(
        {
          round_id: input.roundId,
          startup_id: input.startupId,
          reviewer_id: input.reviewerId,
          score_team: input.scores.team,
          score_market: input.scores.market,
          score_tech: input.scores.tech,
          score_bm: input.scores.bm,
          strengths: input.strengths ?? null,
          concerns: input.concerns ?? null,
          requests: input.requests ?? null,
          verdict: input.verdict,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "round_id,startup_id,reviewer_id" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return toSubmission(data as SubmissionRow);
  }

  // ─── Composite ────────────────
  async getSessionPayload(token: string): Promise<SessionPayload | null> {
    const invite = await this.getInviteByToken(token);
    if (!invite) return null;
    const [round, startups, submissions] = await Promise.all([
      this.getRoundById(invite.roundId),
      this.listStartupsInRound(invite.roundId),
      this.listSubmissionsForReviewer(invite.roundId, invite.reviewerId),
    ]);
    if (!round) return null;
    return {
      reviewer: invite.reviewer,
      round,
      startups,
      submissions,
    };
  }

  async getRoundSummary(roundId: string): Promise<RoundSummary | null> {
    const [round, startups, invites, subs] = await Promise.all([
      this.getRoundById(roundId),
      this.listStartupsInRound(roundId),
      this.listInvites(roundId),
      this.listSubmissionsForRound(roundId),
    ]);
    if (!round) return null;

    const totalPairs = startups.length * invites.length;
    const submissionRate = totalPairs > 0 ? subs.length / totalPairs : 0;

    // 미제출 심사역
    const submittedReviewerIds = new Set(subs.map((s) => s.reviewerId));
    const pendingReviewers = invites
      .filter((inv) => !submittedReviewerIds.has(inv.reviewerId))
      .map((inv) => inv.reviewer);

    // Per startup 집계
    const perStartup = startups.map((s) => {
      const forSt = subs.filter((sub) => sub.startupId === s.id);
      const count = forSt.length;
      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
      const scoreByDimension = {
        team: avg(forSt.map((x) => x.scores.team)),
        market: avg(forSt.map((x) => x.scores.market)),
        tech: avg(forSt.map((x) => x.scores.tech)),
        bm: avg(forSt.map((x) => x.scores.bm)),
      };
      const averageScore = avg([
        scoreByDimension.team,
        scoreByDimension.market,
        scoreByDimension.tech,
        scoreByDimension.bm,
      ]);
      const verdictCounts: Record<Verdict, number> = {
        interested: 0,
        additional_review: 0,
        hold: 0,
        reject: 0,
        undecided: 0,
      };
      forSt.forEach((x) => {
        verdictCounts[x.verdict] += 1;
      });
      return {
        startup: s,
        submissionCount: count,
        averageScore,
        scoreByDimension,
        verdictCounts,
      };
    });

    return {
      round,
      startupCount: startups.length,
      reviewerCount: invites.length,
      submissionCount: subs.length,
      submissionRate,
      pendingReviewers,
      perStartup,
    };
  }
}

// ─────────────────────────────────────────────
// Factory helpers
// ─────────────────────────────────────────────

/** SERVICE_ROLE 로 RLS 우회. API 라우트에서 심사역 토큰 검증 후 or 관리자 인증 통과 후 사용. */
export function getAdminRepository(): SupabaseJudgingRepository {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars 없음");
  const client = createClient(url, key, { auth: { persistSession: false } });
  return new SupabaseJudgingRepository(client);
}
