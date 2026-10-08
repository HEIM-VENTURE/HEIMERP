-- ============================================================
-- HEIM ERP — 기업 포털 (외부 고객 접근)
-- ============================================================
-- 작성: 2026-10-08
-- 목적: 고객 기업이 자기 회사 정보를 로그인해서 보고 편집할 수 있게.
--       profiles.company_id 로 사용자 ↔ 회사 1:1 매핑.
-- ============================================================

-- 1. profiles 에 company_id 추가 (해당 기업 소유 사용자)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- 2. companies RLS: company_member 는 자기 company 만 조회 가능
DROP POLICY IF EXISTS companies_company_member_read ON public.companies;
CREATE POLICY companies_company_member_read ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND p.company_id = companies.id
    )
  );

-- 3. investor_tappings RLS: company_member 자기 거만
DROP POLICY IF EXISTS investor_tappings_company_member_read ON public.investor_tappings;
CREATE POLICY investor_tappings_company_member_read ON public.investor_tappings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND p.company_id = investor_tappings.company_id
    )
  );

-- 4. tapping_events RLS (hop via investor_tappings)
DROP POLICY IF EXISTS tapping_events_company_member_read ON public.tapping_events;
CREATE POLICY tapping_events_company_member_read ON public.tapping_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investor_tappings t
      JOIN public.profiles p ON p.company_id = t.company_id
      WHERE t.id = tapping_events.tapping_id
        AND p.id = auth.uid()
        AND p.role = 'company_member'
    )
  );

-- 5. company_notes RLS: company_member 는 자기 거 조회만 (수정은 admin)
DROP POLICY IF EXISTS company_notes_company_member_read ON public.company_notes;
CREATE POLICY company_notes_company_member_read ON public.company_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND p.company_id = company_notes.company_id
    )
  );
