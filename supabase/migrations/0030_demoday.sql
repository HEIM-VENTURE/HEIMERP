-- ============================================================
-- HEIM ERP — 데모데이 심사 시스템 스키마
-- ============================================================
-- 작성: 2026-08-03
-- 매주 데모데이 · TIPS/LIPS 심사역 대상 · 평가 취합 · 대표 피드백 관리.
--
-- 5개 테이블:
--   demoday_rounds              — 회차 (매주 1건씩 늘어남)
--   demoday_startups            — 회차별 참여 스타트업
--   demoday_reviewers           — 심사역 마스터 (재사용 가능)
--   demoday_reviewer_invites    — 회차 × 심사역 초청 (토큰 저장)
--   demoday_submissions         — 평가 (심사역 × 스타트업 × 회차, upsert)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. demoday_rounds
-- ─────────────────────────────────────────────
CREATE TABLE demoday_rounds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,               -- 'DD-2026-W33'
  title       TEXT NOT NULL,                      -- '8월 3주차 데모데이'
  date        DATE NOT NULL,
  time_range  TEXT,                               -- '14:00 - 16:00'
  zoom_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'scheduled', 'live', 'completed')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_demoday_rounds_date ON demoday_rounds(date DESC);

-- ─────────────────────────────────────────────
-- 2. demoday_startups (회차 × company)
-- ─────────────────────────────────────────────
CREATE TABLE demoday_startups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID NOT NULL REFERENCES demoday_rounds(id) ON DELETE CASCADE,
  company_id    BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  session       TEXT,                             -- '1부' / '2부' / '3부'
  pitch_order   INT,
  pitch_time    TEXT,                             -- '14:00'
  ir_deck_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, company_id)
);
CREATE INDEX idx_demoday_startups_round ON demoday_startups(round_id, pitch_order);

-- ─────────────────────────────────────────────
-- 3. demoday_reviewers (마스터)
-- ─────────────────────────────────────────────
CREATE TABLE demoday_reviewers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  organization          TEXT NOT NULL,
  role                  TEXT,                     -- '수석 심사역'
  email                 TEXT UNIQUE NOT NULL,     -- 식별 키
  phone                 TEXT,
  type                  TEXT CHECK (type IN ('vc', 'ac', 'corp', 'cvc', 'tech_holding', 'family_office', 'angel', 'etc')),
  preferred_industries  TEXT[],
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_demoday_reviewers_email ON demoday_reviewers(email);

-- ─────────────────────────────────────────────
-- 4. demoday_reviewer_invites (round × reviewer + token)
-- ─────────────────────────────────────────────
CREATE TABLE demoday_reviewer_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID NOT NULL REFERENCES demoday_rounds(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES demoday_reviewers(id) ON DELETE CASCADE,
  token         TEXT UNIQUE NOT NULL,             -- 64자 hex (crypto.randomBytes 32)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  UNIQUE (round_id, reviewer_id)
);
CREATE INDEX idx_demoday_invites_token ON demoday_reviewer_invites(token) WHERE revoked_at IS NULL;

-- ─────────────────────────────────────────────
-- 5. demoday_submissions (평가 · upsert)
-- ─────────────────────────────────────────────
CREATE TABLE demoday_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID NOT NULL REFERENCES demoday_rounds(id) ON DELETE CASCADE,
  startup_id    UUID NOT NULL REFERENCES demoday_startups(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES demoday_reviewers(id) ON DELETE CASCADE,
  score_team    SMALLINT NOT NULL CHECK (score_team BETWEEN 1 AND 5),
  score_market  SMALLINT NOT NULL CHECK (score_market BETWEEN 1 AND 5),
  score_tech    SMALLINT NOT NULL CHECK (score_tech BETWEEN 1 AND 5),
  score_bm      SMALLINT NOT NULL CHECK (score_bm BETWEEN 1 AND 5),
  total_score   SMALLINT GENERATED ALWAYS AS (score_team + score_market + score_tech + score_bm) STORED,
  strengths     TEXT,
  concerns      TEXT,
  requests      TEXT,
  verdict       TEXT NOT NULL CHECK (verdict IN ('interested', 'additional_review', 'hold', 'reject', 'undecided')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, startup_id, reviewer_id)      -- 스펙 §7-1: (심사역 × 기업 × 회차) 재제출은 새 행이 아니라 갱신
);
CREATE INDEX idx_demoday_subs_round ON demoday_submissions(round_id);
CREATE INDEX idx_demoday_subs_reviewer ON demoday_submissions(round_id, reviewer_id);
CREATE INDEX idx_demoday_subs_startup ON demoday_submissions(round_id, startup_id);

-- ─────────────────────────────────────────────
-- updated_at 자동 갱신
-- ─────────────────────────────────────────────
CREATE TRIGGER set_timestamp_demoday_rounds
  BEFORE UPDATE ON demoday_rounds
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_demoday_submissions
  BEFORE UPDATE ON demoday_submissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ─────────────────────────────────────────────
-- RLS: 관리자만 직접 접근. 심사역 세션은 SERVICE_ROLE 로 API에서 처리.
-- ─────────────────────────────────────────────
ALTER TABLE demoday_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE demoday_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE demoday_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE demoday_reviewer_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE demoday_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY demoday_rounds_admin ON demoday_rounds
  FOR ALL USING (app_user_role() = 'admin') WITH CHECK (app_user_role() = 'admin');

CREATE POLICY demoday_startups_admin ON demoday_startups
  FOR ALL USING (app_user_role() = 'admin') WITH CHECK (app_user_role() = 'admin');

CREATE POLICY demoday_reviewers_admin ON demoday_reviewers
  FOR ALL USING (app_user_role() = 'admin') WITH CHECK (app_user_role() = 'admin');

CREATE POLICY demoday_invites_admin ON demoday_reviewer_invites
  FOR ALL USING (app_user_role() = 'admin') WITH CHECK (app_user_role() = 'admin');

CREATE POLICY demoday_submissions_admin ON demoday_submissions
  FOR ALL USING (app_user_role() = 'admin') WITH CHECK (app_user_role() = 'admin');
