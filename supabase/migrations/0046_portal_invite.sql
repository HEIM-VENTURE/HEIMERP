-- ============================================================
-- HEIM ERP — 신규 기업 추가 시 포털 계정 자동 매핑
-- ============================================================
-- 작성: 2026-10-08
-- 목적: 기업 추가할 때 '담당자 이메일' 하나만 넣으면,
--       그 사용자가 Google 로그인했을 때 자동으로 그 회사와 매핑.
-- ============================================================

-- 1. companies 에 포털 초대 이메일 필드 (복수 가능)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS portal_invite_emails TEXT[];

CREATE INDEX IF NOT EXISTS idx_companies_portal_invite_emails
  ON public.companies USING GIN(portal_invite_emails);

-- 2. handle_new_user() 수정 — 신규 로그인 시 초대 이메일 매칭 확인
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_name TEXT;
  v_email_lower TEXT;
  v_company_id BIGINT;
BEGIN
  v_email_lower := LOWER(NEW.email);
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- 1) heimvi.com / heiminworld.com 도메인 → admin
  IF v_email_lower LIKE '%@heimvi.com' OR v_email_lower LIKE '%@heiminworld.com' THEN
    v_role := 'admin'::app_role;
    v_company_id := NULL;
  ELSE
    -- 2) companies.portal_invite_emails 에 등록된 이메일인지 확인
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE v_email_lower = ANY(SELECT LOWER(unnest(portal_invite_emails)))
    LIMIT 1;

    IF v_company_id IS NOT NULL THEN
      v_role := 'company_member'::app_role;
    ELSE
      v_role := 'company_member'::app_role;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, company_id)
  VALUES (NEW.id, NEW.email, v_name, v_role, v_company_id);

  RETURN NEW;
END;
$$;

-- 3. 기존에 로그인한 사용자도 소급 매핑 (초대 이메일 등록된 사람이 이미 가입했으면 자동 연결)
CREATE OR REPLACE FUNCTION public.sync_portal_invites()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  updated_count INT := 0;
BEGIN
  UPDATE public.profiles p
  SET company_id = c.id, role = 'company_member'::app_role
  FROM public.companies c
  WHERE p.role != 'admin'
    AND p.company_id IS NULL
    AND LOWER(p.email) = ANY(SELECT LOWER(unnest(c.portal_invite_emails)));

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
