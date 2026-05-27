-- ============================================================
-- HEIM ERP — service_role에 GRANT 부여
-- ============================================================
-- "Automatically expose new tables" 옵션을 끈 경우, service_role도 GRANT 없이 시작.
-- service_role은 RLS를 우회하지만 GRANT는 별개로 필요.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 미래의 테이블에도 자동 적용
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
