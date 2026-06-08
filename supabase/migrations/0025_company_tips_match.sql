-- ============================================================
-- HEIM ERP — companies 와 tips_operators 매칭
-- ============================================================
-- 기업 1개당 매칭된 TIPS 운영사 1곳 추적.
-- 운영사가 삭제되면 매칭은 자동 해제(SET NULL).

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS tips_operator_id UUID
  REFERENCES tips_operators(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_tips_operator
  ON companies(tips_operator_id);
