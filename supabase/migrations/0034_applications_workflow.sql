-- ============================================================
-- HEIM ERP — applications 판정 워크플로 컬럼 추가
-- ============================================================
-- Phase 1d 첫 스텝: 관리자 판정 저장 · NO-GO 숨김 처리 · 이메일 큐잉
--
-- 정책:
--  - NO-GO는 완전 삭제하지 않고 archived_at 세팅으로 목록에서만 감춘다 (안전 모드)
--  - 판정 이메일은 별도 큐로 관리 (email_pending / email_sent_at)
--    → Vercel 배포에는 SMTP가 없으므로 Apps Script + Sheets로 처리 예정 (다음 세션)
-- ============================================================

ALTER TABLE applications
  -- NO-GO 시 세팅. NULL이면 아직 활성 신청.
  ADD COLUMN archived_at         TIMESTAMPTZ,
  -- 이메일 발송 대기 큐. GO/more_docs 판정 시 true → Apps Script가 훑어서 발송 후 false로.
  ADD COLUMN email_pending       BOOLEAN NOT NULL DEFAULT false,
  -- 최근 발송 성공 시각. NULL이면 미발송.
  ADD COLUMN email_sent_at       TIMESTAMPTZ,
  -- 발송 실패 시 원인. NULL이면 정상.
  ADD COLUMN email_error         TEXT;

-- archived_at IS NULL 필터 인덱스 (활성 신청만 빠르게)
CREATE INDEX idx_applications_active
  ON applications (received_at DESC)
  WHERE archived_at IS NULL;

-- 이메일 큐 스캔용 인덱스
CREATE INDEX idx_applications_email_pending
  ON applications (received_at)
  WHERE email_pending = true;

COMMENT ON COLUMN applications.archived_at IS
  'NO-GO 판정 시 세팅. 관리자 목록에서 숨김. 이력은 DB에 남는다.';
COMMENT ON COLUMN applications.email_pending IS
  'GO / more_docs 판정 시 true. Apps Script가 이 플래그를 훑어 이메일 발송 후 false로 전환.';
