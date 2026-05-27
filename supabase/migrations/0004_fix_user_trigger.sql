-- ============================================================
-- HEIM ERP — handle_new_user 트리거 권한 픽스
-- ============================================================
-- 문제: SECURITY DEFINER 함수에 search_path가 비어 있으면 public.profiles를
-- 찾지 못해 "Database error creating new user" 에러 발생.
-- 해결: search_path 명시 + INSERT 정책 추가 (안전망).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'company_member'
  );
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS profiles_self_insert ON profiles;
CREATE POLICY profiles_self_insert ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
