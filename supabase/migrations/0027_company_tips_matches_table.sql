-- ============================================================
-- HEIM ERP — TIPS 매칭을 N:M 으로 (별도 테이블) + 0025/0026 데이터 통합
-- ============================================================
-- 한 기업이 여러 운영사에 매칭될 수 있도록 join 테이블로 전환.
-- 기존 companies.tips_operator_id / tips_match_valuation / tips_match_investment
-- 컬럼은 신규 테이블로 데이터 이전 후 제거.

-- ── 1. 신규 매칭 테이블 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_tips_matches (
  id            BIGSERIAL PRIMARY KEY,
  company_id    BIGINT NOT NULL REFERENCES companies(id)       ON DELETE CASCADE,
  tips_operator_id UUID NOT NULL REFERENCES tips_operators(id) ON DELETE CASCADE,
  valuation     BIGINT,            -- 백만원 (UI는 억으로 변환)
  investment    BIGINT,            -- 백만원
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, tips_operator_id)
);

CREATE INDEX IF NOT EXISTS idx_ctm_company  ON company_tips_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_ctm_operator ON company_tips_matches(tips_operator_id);

ALTER TABLE company_tips_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ctm_admin_all ON company_tips_matches;
CREATE POLICY ctm_admin_all ON company_tips_matches
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS ctm_hvp_read ON company_tips_matches;
CREATE POLICY ctm_hvp_read ON company_tips_matches
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
  );

-- ── 2. 기존 단일 매칭 데이터(0025/0026) 이전 ─────────────────
-- tips_operator_id 컬럼이 있으면 행을 옮긴다
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='companies' AND column_name='tips_operator_id'
  ) THEN
    EXECUTE '
      INSERT INTO company_tips_matches (company_id, tips_operator_id)
      SELECT id, tips_operator_id FROM companies
      WHERE tips_operator_id IS NOT NULL
      ON CONFLICT (company_id, tips_operator_id) DO NOTHING
    ';
  END IF;
END $$;

-- valuation 이 옛 컬럼에 있었으면 가져온다
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='companies' AND column_name='tips_match_valuation'
  ) THEN
    EXECUTE '
      UPDATE company_tips_matches m
      SET valuation = c.tips_match_valuation
      FROM companies c
      WHERE c.id = m.company_id AND c.tips_match_valuation IS NOT NULL
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='companies' AND column_name='tips_match_investment'
  ) THEN
    EXECUTE '
      UPDATE company_tips_matches m
      SET investment = c.tips_match_investment
      FROM companies c
      WHERE c.id = m.company_id AND c.tips_match_investment IS NOT NULL
    ';
  END IF;
END $$;

-- ── 3. 옛 컬럼 제거 ──────────────────────────────────────────
ALTER TABLE companies DROP COLUMN IF EXISTS tips_operator_id;
ALTER TABLE companies DROP COLUMN IF EXISTS tips_match_valuation;
ALTER TABLE companies DROP COLUMN IF EXISTS tips_match_investment;

-- ── 4. updated_at 자동 갱신 트리거 ───────────────────────────
DROP TRIGGER IF EXISTS set_timestamp_ctm ON company_tips_matches;
CREATE TRIGGER set_timestamp_ctm BEFORE UPDATE ON company_tips_matches
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
