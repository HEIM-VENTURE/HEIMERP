-- ============================================================
-- HEIM ERP — 접수번호 prefix 오타 수정 (HAIM → HEIM)
-- ============================================================
-- 0031에서 `HAIM-APP-YYYY-NNNN`로 발급되던 것을 정정.
-- 회사명이 HEIM VENTURE INVESTMENT이므로 HEIM prefix가 맞음.
--
-- 처리:
--   1. next_application_no() 함수 재정의
--   2. 테스트 발급된 HAIM-APP-* 행 삭제 (실운영 전이라 안전)
--   3. sequence를 1로 리셋 → 첫 실데이터가 HEIM-APP-YYYY-0001
--
-- ⚠️ Storage bucket의 `applications/HAIM-APP-*/` 폴더는 SQL로 삭제되지 않음.
--    Supabase 대시보드 → Storage → company-files → applications/HAIM-APP-2026-0001/
--    에서 수동 삭제 필요.
-- ============================================================

-- 1. 함수 재정의
CREATE OR REPLACE FUNCTION next_application_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Seoul');
  v_seq  INT := nextval('application_no_seq');
BEGIN
  RETURN FORMAT('HEIM-APP-%s-%s', v_year, LPAD(v_seq::TEXT, 4, '0'));
END;
$$;

-- 2. 테스트 데이터 삭제 (0031 배포 후 발급된 HAIM-* 접수건 정리)
DELETE FROM applications WHERE application_no LIKE 'HAIM-APP-%';

-- 3. sequence 리셋 → 다음 발급은 HEIM-APP-YYYY-0001부터
ALTER SEQUENCE application_no_seq RESTART WITH 1;
