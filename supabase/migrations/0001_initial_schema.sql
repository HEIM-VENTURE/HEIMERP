-- ============================================================
-- HEIM ERP — 초기 스키마
-- ============================================================
-- 작성: 2026-05-27
-- 컬럼은 영어, UI 라벨은 한국어 (별도 매핑)

-- ============================================================
-- Enum 타입
-- ============================================================
CREATE TYPE app_role AS ENUM ('admin', 'hvp', 'company_member');

CREATE TYPE sales_stage AS ENUM (
  'received',      -- 접수
  'meeting_1st',   -- 1차 미팅
  'proposal',      -- 제안
  'contract',      -- 계약
  'kickoff'        -- 착수
);

CREATE TYPE consulting_stage AS ENUM (
  'kickoff',                -- 착수
  'initial_review',         -- 초기 검토
  'dev_advisory',           -- 개발자문 / 1차 사업계획
  'ir_deck',                -- IR Deck 작업
  'tips_operator_ir',       -- TIPS 운영사 IR
  'tips_review',            -- TIPS 심사
  'fund_closing',           -- 조합 투자절차 Closing
  'final_closing'           -- Final Closing
);

CREATE TYPE program_grade AS ENUM ('premium', 'basic', 'free');

CREATE TYPE hvp_status AS ENUM ('applied', 'training', 'active', 'inactive');
-- 신청 / 교육중 / 활동 / 휴면

CREATE TYPE hvp_application_status AS ENUM ('new', 'reviewing', 'approved', 'rejected');
-- 신규 / 검토 / 승인 / 거절

CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'done');

CREATE TYPE contract_payment_status AS ENUM ('scheduled', 'paid');

CREATE TYPE file_kind AS ENUM (
  'business_plan',  -- 사업계획서
  'ir_deck',        -- IR
  'proposal',       -- 제안서
  'quote',          -- 견적서
  'contract',       -- 계약서
  'meeting_notes',  -- 회의록
  'recording',      -- 녹음
  'other'
);

CREATE TYPE notification_type AS ENUM (
  'stage_changed',
  'todo_assigned',
  'fee_settled',
  'company_added',
  'meeting_added',
  'admin_message'
);

CREATE TYPE custom_field_type AS ENUM ('text', 'number', 'select', 'date', 'checkbox', 'url');

-- ============================================================
-- 1. hvp (영업자 = Heim Venture Partners)
-- ============================================================
CREATE TABLE hvp (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  phone               TEXT,
  email               TEXT UNIQUE,
  organization        TEXT,
  cohort              TEXT,                                    -- "3기", "4기"
  channel             TEXT,                                    -- 유입경로
  referrer            TEXT,
  applied_at          DATE,
  completed_at        DATE,                                    -- 교육이수일
  status              hvp_status NOT NULL DEFAULT 'active',
  default_fee_rate    NUMERIC(4,3) NOT NULL DEFAULT 0.200,     -- 20%
  custom_fields       JSONB NOT NULL DEFAULT '{}'::jsonb,      -- 커스텀 필드 값
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hvp_status ON hvp(status);
CREATE INDEX idx_hvp_cohort ON hvp(cohort);

-- ============================================================
-- 2. profiles (Supabase auth.users 확장)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  role        app_role NOT NULL DEFAULT 'company_member',
  hvp_id      UUID REFERENCES hvp(id) ON DELETE SET NULL,
  company_id  BIGINT,                                          -- FK는 companies 생성 후 ALTER로 추가
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_hvp ON profiles(hvp_id);

-- ============================================================
-- 3. hvp_field_definitions (커스텀 필드 정의)
-- ============================================================
CREATE TABLE hvp_field_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key       TEXT UNIQUE NOT NULL,                        -- JSONB의 key
  label           TEXT NOT NULL,
  field_type      custom_field_type NOT NULL,
  description     TEXT,
  options         JSONB,                                       -- select 타입의 옵션
  required        BOOLEAN NOT NULL DEFAULT false,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. hvp_applications (HVP 마스터코스 신청서, Tally 폼 2)
-- ============================================================
CREATE TABLE hvp_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  organization        TEXT,
  phone               TEXT,
  email               TEXT NOT NULL,
  motivation          TEXT,                                    -- 필요 이유
  channel             TEXT,                                    -- 유입경로
  referrer            TEXT,
  status              hvp_application_status NOT NULL DEFAULT 'new',
  approved_hvp_id     UUID REFERENCES hvp(id) ON DELETE SET NULL,
  source              TEXT NOT NULL DEFAULT 'manual',          -- 'tally_webhook' | 'csv' | 'manual'
  tally_response_id   TEXT UNIQUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at         TIMESTAMPTZ
);

CREATE INDEX idx_hvp_apps_status ON hvp_applications(status);

-- ============================================================
-- 5. companies (스타트업 기업, Tally 폼 1)
-- ============================================================
CREATE TABLE companies (
  id                      BIGSERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,                       -- 회사명
  address                 TEXT,                                -- 소재지
  ceo_name                TEXT,
  phone                   TEXT,
  email                   TEXT,
  main_item               TEXT,                                -- 주요 아이템
  founded_at              DATE,                                -- 설립일자
  last_year_revenue       NUMERIC,                             -- 직전년도 매출액 (단위: 백만원)
  inquiry_purpose         TEXT,                                -- 접수목적

  hvp_id                  UUID REFERENCES hvp(id) ON DELETE SET NULL,
  consultant_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,

  sales_stage             sales_stage NOT NULL DEFAULT 'received',
  consulting_stage        consulting_stage,                    -- 착수 후에만 채워짐
  program_grade           program_grade,
  proposal_amount         NUMERIC,                             -- 컨설팅 제안금액 (단위: 만원)
  fee_rate                NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  drop_reason             TEXT,

  received_at             DATE NOT NULL DEFAULT CURRENT_DATE,  -- 접수일
  contracted_at           DATE,                                -- 계약일
  started_at              DATE,                                -- 착수일

  -- Tally에서 수집되는 접수자 정보 (HVP와 자동 매칭하기 전 임시)
  submitter_name          TEXT,
  submitter_phone         TEXT,
  submitter_email         TEXT,

  source                  TEXT NOT NULL DEFAULT 'manual',
  tally_response_id       TEXT UNIQUE,
  custom_fields           JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes                   TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_sales_stage ON companies(sales_stage);
CREATE INDEX idx_companies_consulting_stage ON companies(consulting_stage);
CREATE INDEX idx_companies_hvp_id ON companies(hvp_id);
CREATE INDEX idx_companies_received_at ON companies(received_at DESC);

-- profiles.company_id FK 이제 추가
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ============================================================
-- 6. company_stage_history (단계 변경 이력)
-- ============================================================
CREATE TABLE company_stage_history (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage_type  TEXT NOT NULL CHECK (stage_type IN ('sales', 'consulting')),
  from_stage  TEXT,
  to_stage    TEXT NOT NULL,
  changed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_history_company ON company_stage_history(company_id, created_at DESC);

-- ============================================================
-- 7. meetings (미팅·회의록)
-- ============================================================
CREATE TABLE meetings (
  id                  BIGSERIAL PRIMARY KEY,
  company_id          BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sequence            TEXT,                                    -- '1차', '2차', '내부' 등
  title               TEXT,
  meeting_date        DATE NOT NULL,
  attendees           TEXT,                                    -- 자유 입력
  body                TEXT,                                    -- 회의록 본문
  recording_url       TEXT,                                    -- Cloudflare R2 URL
  ai_summary          TEXT,
  ai_summary_at       TIMESTAMPTZ,
  author_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_company ON meetings(company_id, meeting_date DESC);

-- ============================================================
-- 8. todos
-- ============================================================
CREATE TABLE todos (
  id              BIGSERIAL PRIMARY KEY,
  company_id      BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  assignee_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date        DATE,
  status          todo_status NOT NULL DEFAULT 'pending',
  auto_generated  BOOLEAN NOT NULL DEFAULT false,             -- 단계 변경으로 자동 생성?
  trigger_stage   TEXT,                                       -- 자동 생성 시 어떤 단계
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_todos_assignee ON todos(assignee_id, status);
CREATE INDEX idx_todos_company ON todos(company_id);
CREATE INDEX idx_todos_due ON todos(due_date) WHERE status != 'done';

-- ============================================================
-- 9. files (자료실)
-- ============================================================
CREATE TABLE files (
  id            BIGSERIAL PRIMARY KEY,
  company_id    BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  meeting_id    BIGINT REFERENCES meetings(id) ON DELETE SET NULL,
  filename      TEXT NOT NULL,
  url           TEXT NOT NULL,                                 -- R2 URL
  kind          file_kind NOT NULL DEFAULT 'other',
  size_bytes    BIGINT,
  uploader_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_company ON files(company_id);

-- ============================================================
-- 10. contracts (계약·수수료)
-- ============================================================
CREATE TABLE contracts (
  id                BIGSERIAL PRIMARY KEY,
  company_id        BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contracted_at     DATE NOT NULL,
  total_amount      NUMERIC NOT NULL,                          -- 컨설팅 총액 (단위: 만원)
  hvp_id            UUID REFERENCES hvp(id) ON DELETE SET NULL,
  hvp_fee_rate      NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  hvp_fee_amount    NUMERIC GENERATED ALWAYS AS (total_amount * hvp_fee_rate) STORED,
  payment_status    contract_payment_status NOT NULL DEFAULT 'scheduled',
  paid_at           DATE,
  contract_file_url TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_company ON contracts(company_id);
CREATE INDEX idx_contracts_hvp ON contracts(hvp_id);

-- ============================================================
-- 11. notifications
-- ============================================================
CREATE TABLE notifications (
  id            BIGSERIAL PRIMARY KEY,
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id    BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT,
  href          TEXT,
  email_sent    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at       TIMESTAMPTZ
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read_at, created_at DESC);

-- ============================================================
-- 12. activity_log
-- ============================================================
CREATE TABLE activity_log (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_company ON activity_log(company_id, created_at DESC);

-- ============================================================
-- 13. tips_operators (TIPS 운영사 DB)
-- ============================================================
CREATE TABLE tips_operators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  contact_person  TEXT,
  focus_area      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 트리거: updated_at 자동 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_hvp BEFORE UPDATE ON hvp
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_companies BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_meetings BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_contracts BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_tips BEFORE UPDATE ON tips_operators
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- 트리거: auth.users 생성 시 profiles 자동 생성
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'company_member'  -- 기본은 가장 낮은 권한, 관리자가 나중에 승격
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 트리거: 단계 변경 시 자동으로 history 기록 + 날짜 채우기
-- ============================================================
CREATE OR REPLACE FUNCTION handle_sales_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sales_stage IS DISTINCT FROM OLD.sales_stage THEN
    INSERT INTO company_stage_history (company_id, stage_type, from_stage, to_stage, changed_by)
    VALUES (NEW.id, 'sales', OLD.sales_stage::TEXT, NEW.sales_stage::TEXT, auth.uid());

    -- 단계 자동 날짜
    IF NEW.sales_stage = 'contract' AND NEW.contracted_at IS NULL THEN
      NEW.contracted_at := CURRENT_DATE;
    END IF;
    IF NEW.sales_stage = 'kickoff' AND NEW.started_at IS NULL THEN
      NEW.started_at := CURRENT_DATE;
      IF NEW.consulting_stage IS NULL THEN
        NEW.consulting_stage := 'kickoff';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_sales_stage_change BEFORE UPDATE OF sales_stage ON companies
  FOR EACH ROW EXECUTE FUNCTION handle_sales_stage_change();

CREATE OR REPLACE FUNCTION handle_consulting_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consulting_stage IS DISTINCT FROM OLD.consulting_stage THEN
    INSERT INTO company_stage_history (company_id, stage_type, from_stage, to_stage, changed_by)
    VALUES (NEW.id, 'consulting', OLD.consulting_stage::TEXT, NEW.consulting_stage::TEXT, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_consulting_stage_change BEFORE UPDATE OF consulting_stage ON companies
  FOR EACH ROW EXECUTE FUNCTION handle_consulting_stage_change();
