-- ============================================================
-- HEIM ERP — HVP 프로그램 전면 삭제
-- ============================================================
-- 작성: 2026-08-03 (v2: 함수/정책 의존성 순서 재정비)
-- HVP(Heim Venture Partners) 프로그램 중단 결정에 따른 전 스택 정리.
--
-- 실행 순서 (트랜잭션 안전):
--   1. profiles.role='hvp' → 'company_member' 강등
--   2. auto_create_contract() 재정의 (hvp 컬럼 참조 제거)
--   3. HVP 전용 정책 명시 삭제 (app_user_role 의존성 해제)
--   4. app_user_role() / app_user_hvp_id() 삭제 (app_role_old 및 hvp_id 컬럼 의존성 해제)
--   5. FK 컬럼 DROP
--   6. HVP 테이블 DROP CASCADE
--   7. HVP enum 타입 DROP
--   8. app_role enum 재생성 ('hvp' 값 제거)
--   9. app_user_role() 새 타입으로 재정의
--
-- ⚠️ 되돌릴 수 없음. 22 HVP 시드·신청 이력·온보딩 데이터 소멸.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. 'hvp' 역할 계정을 company_member 로 강등
-- ─────────────────────────────────────────────
UPDATE profiles SET role = 'company_member' WHERE role = 'hvp';

-- ─────────────────────────────────────────────
-- 2. auto_create_contract 재정의 (hvp 컬럼 참조 제거)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_create_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing INT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.sales_stage = NEW.sales_stage THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.sales_stage <> 'contract' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_existing FROM contracts WHERE company_id = NEW.id;
  IF v_existing > 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO contracts (
    company_id,
    contracted_at,
    total_amount,
    payment_status,
    notes
  ) VALUES (
    NEW.id,
    COALESCE(NEW.contracted_at, CURRENT_DATE),
    COALESCE(NEW.proposal_amount, 0),
    'scheduled',
    '단계 진입 시 자동 생성'
  );

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
-- 3. HVP 전용 정책 명시 삭제 (app_user_role 함수 의존 해제)
--    이렇게 안 하면 4단계에서 CASCADE 필요
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS tips_hvp_read ON tips_operators;
DROP POLICY IF EXISTS hvp_self_read ON hvp;
-- 참고: hvp 테이블 위의 다른 hvp_* 정책은 6단계 DROP TABLE hvp CASCADE 로 함께 사라짐

-- ─────────────────────────────────────────────
-- 4. HVP 관련 헬퍼 함수 삭제
--    app_user_role() 은 옛 app_role 타입 리턴형이라 재정의 전 삭제 필요.
--    app_user_hvp_id() 는 profiles.hvp_id (곧 삭제) 참조하는 dead code.
--    후자에 딸린 정책 10개(companies_hvp_*, meetings_hvp_rw 등)는 모두 HVP 전용이라
--    CASCADE 로 함께 삭제 (HVP 역할 자체가 없어져서 아무도 트리거 안 함).
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.app_user_role();
DROP FUNCTION IF EXISTS public.app_user_hvp_id() CASCADE;

-- ─────────────────────────────────────────────
-- 5. FK 컬럼 삭제
-- ─────────────────────────────────────────────
ALTER TABLE companies DROP COLUMN IF EXISTS hvp_id CASCADE;
ALTER TABLE contracts DROP COLUMN IF EXISTS hvp_id CASCADE;
ALTER TABLE contracts DROP COLUMN IF EXISTS hvp_fee_rate CASCADE;
ALTER TABLE contracts DROP COLUMN IF EXISTS hvp_fee_amount CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS hvp_id CASCADE;

-- ─────────────────────────────────────────────
-- 6. HVP 관련 테이블 삭제 (트리거·정책·인덱스 자동 삭제)
-- ─────────────────────────────────────────────
DROP TABLE IF EXISTS hvp_applications CASCADE;
DROP TABLE IF EXISTS hvp_field_definitions CASCADE;
DROP TABLE IF EXISTS hvp CASCADE;

-- ─────────────────────────────────────────────
-- 7. HVP 전용 enum 타입 삭제
-- ─────────────────────────────────────────────
DROP TYPE IF EXISTS hvp_status;
DROP TYPE IF EXISTS hvp_application_status;

-- ─────────────────────────────────────────────
-- 8. app_role 에서 'hvp' 제거 (enum 재생성)
--    이 시점에는 app_role 을 참조하는 함수/정책이 없어야 함
--    (4단계에서 app_user_role() 을 미리 삭제했기 때문)
-- ─────────────────────────────────────────────
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('admin', 'company_member');

-- profiles.role: default 먼저 떼고, 타입 바꾸고, default 재적용
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles
  ALTER COLUMN role TYPE app_role
  USING role::text::app_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'company_member';

DROP TYPE app_role_old;

-- ─────────────────────────────────────────────
-- 9. app_user_role() 새 app_role 타입으로 재정의
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.app_user_role()
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────
-- 10. 알림 타입 fee_settled 는 HVP 정산 전용이었으나 enum 값이라
--     남겨도 무해. 별도 정리 필요 시 후속 마이그레이션.
-- ─────────────────────────────────────────────
