-- ============================================================
-- HEIM ERP — TIPS 매칭에 프로그램 구분 추가 (TIPS / LIPS)
-- ============================================================

-- ── 1. program 컬럼 추가 ─────────────────────────────────────
ALTER TABLE company_tips_matches ADD COLUMN IF NOT EXISTS program TEXT;
UPDATE company_tips_matches SET program = 'TIPS' WHERE program IS NULL;
ALTER TABLE company_tips_matches ALTER COLUMN program SET NOT NULL;
ALTER TABLE company_tips_matches ALTER COLUMN program SET DEFAULT 'TIPS';

-- ── 2. CHECK 제약 ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ctm_program_check') THEN
    ALTER TABLE company_tips_matches
      ADD CONSTRAINT ctm_program_check CHECK (program IN ('TIPS', 'LIPS'));
  END IF;
END $$;

-- ── 3. UNIQUE 갱신: 같은 운영사라도 TIPS/LIPS 분리 매칭 가능 ─
-- 기존 (company_id, tips_operator_id) UNIQUE 제거 → (company_id, tips_operator_id, program) 으로
ALTER TABLE company_tips_matches
  DROP CONSTRAINT IF EXISTS company_tips_matches_company_id_tips_operator_id_key;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ctm_company_op_program_unique') THEN
    ALTER TABLE company_tips_matches
      ADD CONSTRAINT ctm_company_op_program_unique
      UNIQUE (company_id, tips_operator_id, program);
  END IF;
END $$;
