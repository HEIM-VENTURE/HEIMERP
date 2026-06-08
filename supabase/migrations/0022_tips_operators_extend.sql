-- ============================================================
-- HEIM ERP — tips_operators 확장 + 15개 운영사 시드
-- ============================================================
-- 1) assigned_pm (담당 심사역), last_meeting_at (미팅 이력) 컬럼 추가
-- 2) name UNIQUE 제약으로 ON CONFLICT 안전하게 사용
-- 3) HEIM ADS OS 목업의 tips 컬렉션에서 15개 운영사 import
--    (heim-ads Firestore에서 fetch한 데이터 — name/reviewer/interests/meetingHistory)

-- ── 1. 컬럼 추가 ─────────────────────────────────────────────
ALTER TABLE tips_operators ADD COLUMN IF NOT EXISTS assigned_pm     TEXT;
ALTER TABLE tips_operators ADD COLUMN IF NOT EXISTS last_meeting_at DATE;

-- ── 2. name UNIQUE 제약 (재실행 안전) ────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tips_operators_name_unique'
  ) THEN
    ALTER TABLE tips_operators ADD CONSTRAINT tips_operators_name_unique UNIQUE (name);
  END IF;
END $$;

-- ── 3. 15개 운영사 시드 (ON CONFLICT DO UPDATE) ──────────────
INSERT INTO tips_operators (name, focus_area, assigned_pm, last_meeting_at) VALUES
  ('그래비티벤처스',       '딥테크',          '강영환', '2025-02-06'),
  ('내비온파트너스',       '딥테크',          '박대성', '2026-03-12'),
  ('다래사업화전략',       '딥테크',          '강영환', '2025-04-20'),
  ('라이징에스벤처스',     '딥테크',          '강영환', '2026-04-22'),
  ('블리스바인벤처스',     '딥테크',          '박대성', NULL),
  ('시리즈벤처스',         '딥테크, 컨텐츠',  '강영환', '2025-02-11'),
  ('알파브라더스',         '컨텐츠',          '강영환', '2026-01-15'),
  ('임팩트스퀘어',         '딥테크',          '기동현', '2025-05-13'),
  ('젠엑시스',             '바이오, 테크',    '박대성', NULL),
  ('컴퍼니X',              '컨텐츠',          '강영환', '2026-01-19'),
  ('티비지파트너스',       '바이오',          '기동현', '2026-04-20'),
  ('한국가치투자',         '컨텐츠',          '강영환', '2026-04-27'),
  ('한국공학대학기술지주', '딥테크',          '강영환', '2026-04-22'),
  ('한림대기술지주',       '딥테크',          '기동현', '2025-05-19'),
  ('JCH인베스트먼트',      '딥테크',          '강영환', '2026-04-27')
ON CONFLICT (name) DO UPDATE SET
  focus_area      = EXCLUDED.focus_area,
  assigned_pm     = EXCLUDED.assigned_pm,
  last_meeting_at = EXCLUDED.last_meeting_at;
