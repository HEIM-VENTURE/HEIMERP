-- ============================================================
-- HEIM ERP — 기업 포털 파일 공유 (양방향)
-- ============================================================
-- 작성: 2026-10-08
-- 목적: company_member 가 자기 회사 files 조회·업로드·삭제 가능.
--       기업이 올린 세금계산서·계약서를 admin 쪽에서 바로 봄 (반대도).
-- ============================================================

-- 1. files 테이블 — company_member 는 자기 회사 거만 SELECT/INSERT/DELETE
DROP POLICY IF EXISTS files_company_member_read ON public.files;
CREATE POLICY files_company_member_read ON public.files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND p.company_id = files.company_id
    )
  );

DROP POLICY IF EXISTS files_company_member_insert ON public.files;
CREATE POLICY files_company_member_insert ON public.files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND p.company_id = files.company_id
    )
  );

DROP POLICY IF EXISTS files_company_member_delete ON public.files;
CREATE POLICY files_company_member_delete ON public.files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND p.company_id = files.company_id
        -- 본인이 올린 것만 삭제 가능 (admin이 올린 건 삭제 금지)
        AND p.id = files.uploader_id
    )
  );

-- 2. Storage 'company-files' 버킷 — company_member RLS
DROP POLICY IF EXISTS "company-files company_member read" ON storage.objects;
CREATE POLICY "company-files company_member read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'company-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        -- 경로가 '{company_id}/...' 로 시작하는지 확인
        AND (storage.foldername(name))[1] = p.company_id::text
    )
  );

DROP POLICY IF EXISTS "company-files company_member insert" ON storage.objects;
CREATE POLICY "company-files company_member insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'company-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND (storage.foldername(name))[1] = p.company_id::text
    )
  );

DROP POLICY IF EXISTS "company-files company_member delete" ON storage.objects;
CREATE POLICY "company-files company_member delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'company-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company_member'
        AND (storage.foldername(name))[1] = p.company_id::text
    )
  );

-- 3. files 테이블에 'source' 컬럼 추가 (누가 올렸는지 구분: admin / company)
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin';
  -- source: 'admin' / 'company' / 'auto'

-- kind 에 세금계산서·계약서·법인등기 등 추가 가능 (현재는 TEXT 라 자유)
