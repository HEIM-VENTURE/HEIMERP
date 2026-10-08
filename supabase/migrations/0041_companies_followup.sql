-- ============================================================
-- HEIM ERP — 기업 후속 관리 (Drive 링크 · 다음 액션)
-- ============================================================
-- 작성: 2026-10-08
-- 목적: 46개+ 기업을 놓치지 않고 관리하기 위해
--       (1) Drive 폴더 URL 수동/자동 연결, (2) 다음 액션 메모·마감일
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS drive_folder_url TEXT,         -- Drive 폴더 링크 (수동 or 자동)
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,          -- Drive API 식별자 (자동 연동 시)
  ADD COLUMN IF NOT EXISTS next_action TEXT,              -- 다음에 해야 할 것 한 줄
  ADD COLUMN IF NOT EXISTS next_action_due DATE,          -- 그 액션의 마감일
  ADD COLUMN IF NOT EXISTS last_contact_at DATE;          -- 마지막 접촉일 (수동 체크 or 자동 집계)

CREATE INDEX IF NOT EXISTS idx_companies_next_action_due ON public.companies(next_action_due);
CREATE INDEX IF NOT EXISTS idx_companies_last_contact_at ON public.companies(last_contact_at);
