-- ============================================================
-- HEIM ERP — 기업 접수 폼 첫 섹션 필드 추가
-- ============================================================
-- 작성: 2026-09-28
-- 목적: 사용자 손글씨 노트(기업명·대표자·설립일·매출·직원수·아이템·특허)를
--       접수 폼 첫 섹션으로 배치. applications 테이블에 신규 컬럼.
-- ============================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS established_at DATE,           -- 설립일자
  ADD COLUMN IF NOT EXISTS revenue_2025 NUMERIC,          -- 25년도 매출액 (억)
  ADD COLUMN IF NOT EXISTS revenue_2026_expected NUMERIC, -- 26년도 예상 매출액 (억)
  ADD COLUMN IF NOT EXISTS main_item TEXT,                -- 아이템명 (제품·서비스명)
  ADD COLUMN IF NOT EXISTS patent_count INT,              -- 특허 건수
  ADD COLUMN IF NOT EXISTS patent_notes TEXT;             -- 특허 관련 메모
