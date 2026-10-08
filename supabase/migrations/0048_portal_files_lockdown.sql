-- ============================================================
-- HEIM ERP — 기업 포털 파일 권한 잠금
-- ============================================================
-- 작성: 2026-10-08
-- 문제:
--   1. 0002 files_company_rw (FOR ALL) 가 남아 있어 company_member 가
--      자기 회사 files 행을 전부 조회·수정·삭제 가능 (admin 업로드 포함).
--      정책은 OR 로 합쳐지므로 0047 의 '본인 것만 삭제' 제한이 무력화됨.
--   2. 회의록·녹음·견적서 등 하임 내부 자료까지 기업이 조회 가능.
--   3. Storage company-files 버킷에서 자기 회사 폴더 전체 읽기·삭제 가능
--      (admin 이 올린 원본 파일 삭제 가능).
-- 조치:
--   - company_member 는 files 를 '읽기만', 그것도 공유 대상만:
--       기업이 직접 올린 것(source='company') 또는
--       하임이 올린 세금계산서·계약서·IR Deck.
--   - 포털 업로드는 Drive 로 대체됐으므로 files INSERT/DELETE 권한 제거.
--   - Storage 직접 접근 권한 제거 (다운로드는 서버 액션이 서명 URL 발급).
-- admin 권한(files_admin_all)은 변경 없음.
-- ============================================================

-- 1. files — 넓은 정책 제거
DROP POLICY IF EXISTS files_company_rw ON public.files;
DROP POLICY IF EXISTS files_hvp_rw ON public.files;
DROP POLICY IF EXISTS files_company_member_insert ON public.files;
DROP POLICY IF EXISTS files_company_member_delete ON public.files;

-- 2. files — 공유 대상만 읽기
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
    AND (
      files.source = 'company'
      OR files.kind::text IN ('tax_invoice', 'contract', 'ir_deck')
    )
  );

-- 3. Storage — company_member 직접 접근 제거
DROP POLICY IF EXISTS "company-files company_member read" ON storage.objects;
DROP POLICY IF EXISTS "company-files company_member insert" ON storage.objects;
DROP POLICY IF EXISTS "company-files company_member delete" ON storage.objects;

-- 확인용: 아래 결과에 files_admin_all, files_company_member_read 두 개만 남아야 함
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'files';
