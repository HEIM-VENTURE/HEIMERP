-- ============================================================
-- HEIM ERP — 프로필 사진 (avatar_url + avatars 버킷)
-- ============================================================
-- /admin/settings 에서 프로필 사진 업로드/표시용.
--
-- 1) profiles 에 avatar_url 컬럼 추가 (없으면)
-- 2) avatars 공개 버킷 생성 (5MB, 이미지만)
-- 3) 버킷은 public 이라 URL 직접 접근 가능 — 누구나 읽기, 업로드는 service_role 로만 (서버 액션이 본인 id 폴더에만 쓰도록 검증)

-- ── 1. profiles 컬럼 ─────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── 2. avatars 버킷 ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                  -- 공개 (URL 직접 접근)
  5242880,               -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 파일 경로 규칙: {user_id}/{timestamp}.{ext}
-- 모든 쓰기는 서버 액션(service_role)에서 본인 id 폴더에만 업로드하도록 검증.
