-- ============================================================
-- HEIM ERP — J-커브 성장 단계 (10단계)
-- ============================================================
-- 작성: 2026-10-08
-- 목적: 기업마다 J-커브 상 현재 단계를 1~10 으로 표시.
-- 10단계:
--   1 기회가설        · 문제 정의
--   2 문제확증        · 고객 공감
--   3 해결·가설검증   · MVP·초기거래
--   4 시장적합(PMF)   · PMF 달성
--   5 반복엔진        · 수익 반복
--   6 확장준비        · 역량·자원 정비
--   7 규모확장        · 시장 확대
--   8 시스템기업      · 운영 최적화
--   9 재성장·재설계   · 사업모델 진화
--  10 지속가능기업    · 영속·승계
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS growth_stage INT CHECK (growth_stage BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS growth_stage_note TEXT;  -- 그 단계에서의 핵심 병목·과업 메모

CREATE INDEX IF NOT EXISTS idx_companies_growth_stage ON public.companies(growth_stage);
