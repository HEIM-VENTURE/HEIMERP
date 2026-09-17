-- ============================================================
-- HEIM ERP — 태핑 담당자(PM) 컬럼 추가
-- ============================================================
-- 작성: 2026-09-17
-- 목적: 각 태핑 행에 담당 심사역(PM) 지정 → '내 담당' 필터로 개인화
-- ============================================================

ALTER TABLE public.investor_tappings
  ADD COLUMN IF NOT EXISTS pm TEXT;

CREATE INDEX IF NOT EXISTS idx_investor_tappings_pm
  ON public.investor_tappings(pm);
