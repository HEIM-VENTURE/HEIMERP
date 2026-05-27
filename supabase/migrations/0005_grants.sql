-- ============================================================
-- HEIM ERP — 테이블 GRANT (권한 부여)
-- ============================================================
-- 프로젝트 생성 시 "Automatically expose new tables"를 끈 경우,
-- 우리가 직접 GRANT를 부여해야 함.
-- RLS는 별도로 작동 (이미 0002에서 활성화)하므로 권한 부여해도 안전.

-- 스키마 사용 권한
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ===== authenticated (로그인된 사용자) =====
-- 모든 public 테이블 RW 권한
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 미래에 만들어질 테이블에도 자동 적용
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- ===== anon (비로그인) =====
-- Tally Webhook에서 신청서·기업 INSERT만 가능하게
GRANT INSERT ON hvp_applications TO anon;
GRANT INSERT ON companies TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
