-- ============================================================
-- HEIM ERP — @heimvi.com 도메인 이메일은 자동으로 admin
-- ============================================================
-- 흐름:
--   1. email이 @heimvi.com으로 끝남 → role = 'admin' (최우선)
--   2. email이 hvp 테이블에 등록됨 → role = 'hvp', hvp_id 연결
--   3. 그 외 → role = 'company_member'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hvp_id UUID;
  v_hvp_name TEXT;
  v_role app_role;
  v_name TEXT;
BEGIN
  -- 1. heimvi.com 도메인 = admin (최우선)
  IF LOWER(NEW.email) LIKE '%@heimvi.com' THEN
    v_role := 'admin'::app_role;
    v_hvp_id := NULL;
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  ELSE
    -- 2. HVP 매칭 시도
    SELECT id, name INTO v_hvp_id, v_hvp_name
    FROM hvp
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF v_hvp_id IS NOT NULL THEN
      v_role := 'hvp'::app_role;
      v_name := v_hvp_name;
    ELSE
      v_role := 'company_member'::app_role;
      v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, hvp_id)
  VALUES (NEW.id, NEW.email, v_name, v_role, v_hvp_id);

  RETURN NEW;
END;
$$;

-- ============================================================
-- 기존 @heimvi.com 사용자도 admin으로 즉시 승격 (안전)
-- ============================================================
UPDATE profiles
SET role = 'admin'
WHERE LOWER(email) LIKE '%@heimvi.com'
  AND role <> 'admin';
