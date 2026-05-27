-- ============================================================
-- HEIM ERP — hvp_applications에 cohort(신청 기수) 컬럼 추가
-- ============================================================
ALTER TABLE hvp_applications
  ADD COLUMN IF NOT EXISTS cohort TEXT;

COMMENT ON COLUMN hvp_applications.cohort IS '신청 기수 (예: 6기, 7기)';
