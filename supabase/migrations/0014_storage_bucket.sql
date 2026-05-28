-- ============================================================
-- HEIM ERP — 자료 업로드용 Supabase Storage 버킷
-- ============================================================
-- 사업계획서·IR Deck·계약서 등 기업 자료 저장.
-- 비공개(private) 버킷 — 업로드/다운로드는 서버(service_role)에서만 처리하고,
-- 다운로드는 signed URL로만 제공. (RLS 우회를 서버 액션의 권한 체크로 대체)
--
-- 파일 경로 규칙: {company_id}/{timestamp}-{원본파일명}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-files',
  'company-files',
  false,                 -- 비공개
  52428800,              -- 50MB 제한
  NULL                   -- 모든 타입 허용
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      public = EXCLUDED.public;

-- service_role 은 RLS 우회하므로 별도 storage.objects 정책 불필요.
-- (모든 업로드/다운로드/삭제는 서버 액션에서 service_role 로 수행하고,
--  권한 검증은 애플리케이션 코드에서 admin / 본인 hvp 기업 여부로 처리)
