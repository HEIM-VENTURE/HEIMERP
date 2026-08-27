-- ============================================================
-- HEIM ERP — 회원가입 트리거에서 HVP 참조 제거
-- ============================================================
-- 작성: 2026-08-05
-- 문제: 0029에서 HVP 테이블·컬럼·enum 값 삭제했으나
--       handle_new_user() 트리거가 여전히 hvp 테이블·hvp_id 컬럼·'hvp'::app_role 참조 →
--       Google 로그인 시 "database error" 크래시.
-- 해결: 트리거 재작성 (HVP 로직 제거, 도메인 기반 admin 부여만 유지)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_name TEXT;
  v_email_lower TEXT;
BEGIN
  v_email_lower := LOWER(NEW.email);
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- @heimvi.com 또는 @heiminworld.com 도메인 → 자동 admin
  IF v_email_lower LIKE '%@heimvi.com' OR v_email_lower LIKE '%@heiminworld.com' THEN
    v_role := 'admin'::app_role;
  ELSE
    v_role := 'company_member'::app_role;
  END IF;

  -- profiles 삽입 (hvp_id 컬럼은 0029에서 삭제됐으므로 제외)
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, v_name, v_role);

  RETURN NEW;
END;
$$;
