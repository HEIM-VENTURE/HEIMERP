-- ============================================================
-- HEIM ERP — 기업 접수(applications) 테이블
-- ============================================================
-- 작성: 2026-08-07
-- /apply 랜딩폼으로 들어온 기업 신청서를 저장. /admin/applications 에서 검토.
--
-- 파일 저장: 기존 company-files 버킷(private) 재사용.
--   경로 규칙: applications/{application_no}/{kind}-{원본파일명}
--
-- Phase 1c 범위: 저장까지만. 판정(GO/조건부/자료요청/NO-GO) 트랜지션·이메일 발송은 다음 마이그레이션.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Status enum (mock 6-state와 일치)
-- ─────────────────────────────────────────────
CREATE TYPE application_status AS ENUM (
  'new',          -- 신규 접수 (미검토)
  'reviewing',    -- 검토 중
  'go',           -- GO 결정
  'conditional',  -- 조건부 GO
  'more_docs',    -- 자료 요청
  'no_go'         -- NO-GO
);

-- ─────────────────────────────────────────────
-- 2. application_no 자동 생성용 sequence (연도별 리셋 X — 단조증가)
-- ─────────────────────────────────────────────
CREATE SEQUENCE application_no_seq START 1;

-- HAIM-APP-YYYY-NNNN 형식으로 반환
CREATE OR REPLACE FUNCTION next_application_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Seoul');
  v_seq  INT := nextval('application_no_seq');
BEGIN
  RETURN FORMAT('HAIM-APP-%s-%s', v_year, LPAD(v_seq::TEXT, 4, '0'));
END;
$$;

-- ─────────────────────────────────────────────
-- 3. applications 테이블
-- ─────────────────────────────────────────────
CREATE TABLE applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_no    TEXT UNIQUE NOT NULL DEFAULT next_application_no(),
  received_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status            application_status NOT NULL DEFAULT 'new',

  -- 기업 정보
  company_name      TEXT NOT NULL,
  business_number   TEXT,
  ceo_name          TEXT NOT NULL,
  headcount         INT NOT NULL DEFAULT 0,
  website           TEXT,
  tagline           TEXT NOT NULL,

  -- 담당자
  contact_name      TEXT NOT NULL,
  contact_role      TEXT,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,

  -- 진단 (mock enum 값들 — CHECK로만 느슨하게)
  growth_stage      TEXT NOT NULL,   -- idea|mvp|poc|early_revenue|recurring|scaling|pre_ipo
  revenue_range     TEXT NOT NULL,   -- none|under_1|1_to_5|5_to_10|10_to_30|30_to_100|over_100|unknown
  growth_trend      TEXT NOT NULL,   -- declining|flat|slow_growth|fast_growth|too_early|not_tracked
  priorities        TEXT[] NOT NULL DEFAULT '{}',  -- 최대 3개
  goals             TEXT NOT NULL DEFAULT '',

  -- 부가
  channel           TEXT,
  consent           BOOLEAN NOT NULL DEFAULT false,

  -- 파일 3종 (Storage 경로 및 메타) — mock 형식과 매치
  --   { ir_deck: {name, path, size_bytes, mime} | null, business_cert: ..., company_intro: ... }
  files             JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 검토·판정 필드 (Phase 1d에서 채워짐)
  reviewer_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_name     TEXT,               -- 스냅샷 (프로필 삭제되어도 이름 남김)
  review_deadline   DATE,
  review_notes      TEXT,
  ai_summary        JSONB,              -- {business_model, market, strengths, weaknesses, risks, recommendation, fit_score}
  decided_at        TIMESTAMPTZ,

  -- 이후 GO 결정 시 생성될 companies 행과 연결
  company_id        BIGINT REFERENCES companies(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT priorities_max_3 CHECK (array_length(priorities, 1) IS NULL OR array_length(priorities, 1) <= 3),
  CONSTRAINT consent_required CHECK (consent = true),
  CONSTRAINT email_format CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX idx_applications_status         ON applications(status);
CREATE INDEX idx_applications_received_at    ON applications(received_at DESC);
CREATE INDEX idx_applications_application_no ON applications(application_no);
CREATE INDEX idx_applications_email          ON applications(email);
CREATE INDEX idx_applications_reviewer       ON applications(reviewer_id) WHERE reviewer_id IS NOT NULL;

-- updated_at 자동 갱신 (기존 trigger_set_timestamp 함수 재사용)
CREATE TRIGGER set_timestamp_applications
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- ─────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────
-- 정책:
--  - anon (익명 웹폼) : INSERT 만 가능 (service_role로 처리하지만 안전장치)
--  - authenticated admin : SELECT/UPDATE
--  - 신청자 본인 조회 : 이번 phase는 불필요 (thanks 페이지는 application_no만 리턴)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY applications_admin_read
  ON applications
  FOR SELECT
  TO authenticated
  USING (app_user_role() = 'admin');

CREATE POLICY applications_admin_update
  ON applications
  FOR UPDATE
  TO authenticated
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

-- INSERT는 service_role 로만 처리하므로 anon/authenticated 정책 없음 (RLS 우회).
-- 필요 시 나중에 heckbox 대신 CAPTCHA + anon insert 정책 추가 가능.

-- ─────────────────────────────────────────────
-- 5. Grants
-- ─────────────────────────────────────────────
GRANT SELECT ON applications TO authenticated;
GRANT UPDATE ON applications TO authenticated;
GRANT ALL    ON applications TO service_role;
GRANT USAGE  ON SEQUENCE application_no_seq TO service_role;

COMMENT ON TABLE applications IS
  '기업 접수 신청서. /apply 랜딩폼 → service_role insert → /admin/applications 검토·판정';
COMMENT ON COLUMN applications.files IS
  '파일 3종 메타. 각 키(ir_deck/business_cert/company_intro)에 {name, path, size_bytes, mime} 저장. path는 company-files 버킷 기준 상대경로.';
COMMENT ON COLUMN applications.company_id IS
  'GO 결정 후 자동 생성되는 companies 행과 연결. Phase 1d에서 채워짐.';
