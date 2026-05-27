-- ============================================================
-- HEIM ERP — 신규 user 가입 시 email 매칭으로 HVP 자동 연결
-- ============================================================
-- 흐름:
--   1. admin이 신청서 "승인" → hvp 행만 생성 (auth user 생성 X)
--   2. HVP가 Google/이메일로 로그인 (해당 email로)
--   3. handle_new_user 트리거가 profiles 생성 시 email 매칭
--   4. 매칭되는 hvp 있으면 자동으로 role='hvp', hvp_id 연결

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hvp_id UUID;
  v_hvp_name TEXT;
BEGIN
  -- 같은 이메일의 HVP가 있는지 확인 (자동 매칭)
  SELECT id, name INTO v_hvp_id, v_hvp_name
  FROM hvp
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  INSERT INTO public.profiles (id, email, name, role, hvp_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_hvp_name, NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE WHEN v_hvp_id IS NOT NULL THEN 'hvp'::app_role ELSE 'company_member'::app_role END,
    v_hvp_id
  );
  RETURN NEW;
END;
$$;
