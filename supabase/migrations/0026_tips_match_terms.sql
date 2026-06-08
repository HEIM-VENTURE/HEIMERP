-- ============================================================
-- HEIM ERP — TIPS 매칭 조건(밸류·투자금액) 컬럼 추가
-- ============================================================
-- 단위: 백만원 (last_year_revenue 와 동일, UI 에서 억으로 환산)

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS tips_match_valuation  BIGINT,
  ADD COLUMN IF NOT EXISTS tips_match_investment BIGINT;
