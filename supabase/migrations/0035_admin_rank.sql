-- ============================================================
-- HEIM ERP — 관리자 계층 (owner / member) 도입
-- ============================================================
-- 정책:
--  - owner: 대표(박대성). 모든 신청 조회·편집 가능
--  - member: 그 외 관리자(수석·선임·심사역 다 동일 등급으로 시작). 본인 담당 + 미배정만 편집 가능. 전체 조회는 명시적으로 요청할 때만.
--
-- profiles.role 은 그대로 유지 ('admin' / 'company_member').
-- rank는 admin 안에서 세분화하는 서브필드.
-- ============================================================

CREATE TYPE admin_rank AS ENUM ('owner', 'member');

ALTER TABLE profiles
  ADD COLUMN admin_rank admin_rank NOT NULL DEFAULT 'member';

-- 초기 seed: admin@heimvi.com은 owner로 승격
UPDATE profiles
   SET admin_rank = 'owner'
 WHERE email = 'admin@heimvi.com';

-- 조회 헬퍼: 현재 사용자가 owner인지
CREATE OR REPLACE FUNCTION app_is_owner()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT admin_rank = 'owner'
       FROM profiles
      WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION app_is_owner() TO authenticated, service_role;

COMMENT ON COLUMN profiles.admin_rank IS
  'admin role 내 세분화. owner = 대표(전체 편집), member = 일반 관리자(본인 담당만 편집).';
