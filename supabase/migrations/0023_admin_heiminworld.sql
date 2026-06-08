-- ============================================================
-- HEIM ERP — @heiminworld.com 도메인도 자동 admin 추가
-- ============================================================
-- 기존 0012는 @heimvi.com 만 admin 처리. heiminworld.com 도메인 추가.

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
  v_email_lower TEXT;
BEGIN
  v_email_lower := LOWER(NEW.email);

  -- 1. HEIM 도메인 = admin (heimvi.com OR heiminworld.com)
  IF v_email_lower LIKE '%@heimvi.com' OR v_email_lower LIKE '%@heiminworld.com' THEN
    v_role := 'admin'::app_role;
    v_hvp_id := NULL;
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  ELSE
    -- 2. HVP 매칭 시도
    SELECT id, name INTO v_hvp_id, v_hvp_name
    FROM hvp
    WHERE LOWER(email) = v_email_lower
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
-- 기존 @heiminworld.com 사용자도 admin으로 즉시 승격
-- ============================================================
UPDATE profiles
SET role = 'admin'
WHERE LOWER(email) LIKE '%@heiminworld.com'
  AND role <> 'admin';
