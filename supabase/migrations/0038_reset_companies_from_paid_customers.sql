-- ============================================================
-- HEIM ERP — companies 리셋: 고객 현황표를 기업 마스터 시드로
-- ============================================================
-- 목적:
--   기존 companies 중 paid_customers 에 연결된 22개만 유지, 나머지 삭제.
--   매칭 안 된 paid_customers 23개를 새 companies 로 만들어 1:1 연결.
--   실행 후 companies 45개 = paid_customers 45개 (1:1)
--
-- ⚠️ 되돌릴 수 없음. 실행 전 Supabase Database → Backups 에서 스냅샷 권장.
--
-- 영향받는 자식 테이블:
--   - contracts / meetings / todos / files / company_tips_matches → CASCADE 자동 삭제
--   - demoday_startups → ON DELETE RESTRICT 라 이 마이그레이션에서 미리 정리
--   - applications → SET NULL (신청서 자체는 유지, company_id 만 비워짐)
--
-- 실행 방법:
--   Supabase Dashboard → SQL Editor → 전체 붙여넣기 → RUN
--   실행 후 아래 검증 쿼리로 결과 확인
-- ============================================================

BEGIN;

-- ── 1. 삭제 대상 companies 에 딸린 demoday_startups 먼저 정리 ──
DELETE FROM demoday_startups
WHERE company_id IN (
  SELECT id FROM companies
  WHERE id NOT IN (
    SELECT company_id FROM paid_customers WHERE company_id IS NOT NULL
  )
);

-- ── 2. paid_customers 에 연결되지 않은 companies 삭제 ──
--     자식(contracts, meetings, todos, files, company_tips_matches) 은 CASCADE 로 함께 삭제
--     applications 는 company_id 만 NULL 로 됨 (신청서는 유지)
DELETE FROM companies
WHERE id NOT IN (
  SELECT company_id FROM paid_customers WHERE company_id IS NOT NULL
);

-- ── 3. 매칭 안 된 paid_customers 를 새 companies 로 INSERT + 연결 ──
DO $$
DECLARE
  pc RECORD;
  new_id BIGINT;
BEGIN
  FOR pc IN
    SELECT * FROM paid_customers WHERE company_id IS NULL ORDER BY no
  LOOP
    INSERT INTO companies (name, founded_at, sales_stage, source, notes)
    VALUES (
      pc.company_name,
      CASE
        WHEN pc.established_at ~ '^\d{4}-\d{2}-\d{2}$'
          THEN pc.established_at::DATE
        ELSE NULL
      END,
      'kickoff',
      'paid_customers',
      NULLIF(
        CONCAT_WS(E'\n',
          CASE WHEN pc.legal_name       IS NOT NULL THEN '법인등기명: ' || pc.legal_name END,
          CASE WHEN pc.new_company_name IS NOT NULL THEN '신규회사명(예정): ' || pc.new_company_name END,
          CASE WHEN pc.new_corp_setup   IS NOT NULL THEN '신규법인 설립: ' || pc.new_corp_setup END,
          CASE WHEN pc.target_program   IS NOT NULL THEN '타깃 프로그램: ' || pc.target_program END,
          CASE WHEN pc.headcount        IS NOT NULL THEN '직원수: ' || pc.headcount END,
          CASE WHEN pc.established_at IS NOT NULL AND NOT (pc.established_at ~ '^\d{4}-\d{2}-\d{2}$')
            THEN '설립일(원문): ' || pc.established_at END
        ),
        ''
      )
    )
    RETURNING id INTO new_id;

    UPDATE paid_customers SET company_id = new_id WHERE id = pc.id;
  END LOOP;
END $$;

-- ── 4. 기존 매칭된 22개 companies 도 sales_stage 를 'kickoff' 로 통일 ──
UPDATE companies
SET sales_stage = 'kickoff'
WHERE id IN (
  SELECT company_id FROM paid_customers WHERE company_id IS NOT NULL
)
AND sales_stage IS DISTINCT FROM 'kickoff';

COMMIT;

-- ============================================================
-- 검증 쿼리 (실행 후 SELECT 로 확인)
-- ============================================================
--
-- 1) companies 총 개수 = 45 여야 함
--    SELECT COUNT(*) AS company_count FROM companies;
--
-- 2) paid_customers 중 매칭 안 된 것 = 0 이어야 함
--    SELECT COUNT(*) AS unlinked_count FROM paid_customers WHERE company_id IS NULL;
--
-- 3) 모든 companies 가 kickoff 단계인지
--    SELECT sales_stage, COUNT(*) FROM companies GROUP BY sales_stage;
--
-- 4) 매칭 결과 확인
--    SELECT c.id, c.name, c.sales_stage, pc.no, pc.company_name
--    FROM companies c
--    LEFT JOIN paid_customers pc ON pc.company_id = c.id
--    ORDER BY pc.no NULLS LAST;
