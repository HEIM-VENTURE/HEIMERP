-- ============================================================
-- HEIM ERP — application_status enum 축소
-- ============================================================
-- 워크플로 단순화: 6-state → 4-state
--   삭제: 'reviewing' (검토 중), 'conditional' (조건부 GO)
--   유지: 'new', 'go', 'more_docs', 'no_go'
--
-- 왜: 실제 판정 흐름에서 "검토 중"은 담당자 배정 상태로 흡수하고
--     "조건부 GO"는 GO에 조건 메모를 붙이는 방식으로 충분하다는 결정.
--
-- PostgreSQL은 enum 값 삭제를 직접 지원하지 않으므로
-- 새 enum → 컬럼 타입 교체 → 옛 enum drop 순서로 처리한다.
-- ============================================================

BEGIN;

-- 1. 삭제 대상 상태를 쓰는 행은 'new'로 되돌린다 (안전장치)
UPDATE applications
   SET status = 'new'
 WHERE status::text IN ('reviewing', 'conditional');

-- 2. 새 enum 생성
CREATE TYPE application_status_new AS ENUM (
  'new',
  'go',
  'more_docs',
  'no_go'
);

-- 3. 컬럼 타입 교체 (default 잠시 제거 후 재설정)
ALTER TABLE applications
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE applications
  ALTER COLUMN status TYPE application_status_new
    USING status::text::application_status_new;

ALTER TABLE applications
  ALTER COLUMN status SET DEFAULT 'new';

-- 4. 옛 enum 삭제 → 새 enum 이름 원상복구
DROP TYPE application_status;
ALTER TYPE application_status_new RENAME TO application_status;

COMMIT;
