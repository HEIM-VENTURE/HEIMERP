-- ============================================================
-- HEIM ERP — 자동 To-do 카테고리 + HVP 온보딩 트리거 + 단계 룰 수정
-- ============================================================
-- 1) todos.category 추가: 'hvp_onboarding' | 'deal' | 'general'
-- 2) HVP 신청 온보딩 단계(신청/결제) 진입 시 자동 To-do (하임용)
-- 3) 딜 단계 룰 변경: 접수→1차 미팅 일정 / 1차 미팅→회의록 업로드+카톡방 개설
--    (기수 카톡방 초대는 HVP 온보딩으로 이동, 카톡방 개설은 딜에 유지)

-- ── 1. category 컬럼 ──────────────────────────────────────
ALTER TABLE todos ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'deal';

-- 기존 자동 To-do는 모두 deal로 (이미 deal 기본값)
UPDATE todos SET category = 'deal' WHERE category IS NULL;

-- ── 2. 헬퍼: category 지원하도록 확장 ─────────────────────
CREATE OR REPLACE FUNCTION add_auto_todo(
  p_company_id BIGINT,
  p_title TEXT,
  p_due_days INT,
  p_trigger_stage TEXT,
  p_category TEXT DEFAULT 'deal'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO todos (company_id, title, due_date, status, auto_generated, trigger_stage, category)
  VALUES (p_company_id, p_title, CURRENT_DATE + p_due_days, 'pending'::todo_status, true, p_trigger_stage, p_category);
END;
$$;

-- 회사 없는(사람 관련) 자동 To-do
CREATE OR REPLACE FUNCTION add_general_todo(
  p_title TEXT,
  p_due_days INT,
  p_trigger_stage TEXT,
  p_category TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO todos (company_id, title, due_date, status, auto_generated, trigger_stage, category)
  VALUES (NULL, p_title, CURRENT_DATE + p_due_days, 'pending'::todo_status, true, p_trigger_stage, p_category);
END;
$$;

-- ── 3. 딜 영업 단계 룰 변경 (접수/1차 미팅) ───────────────
CREATE OR REPLACE FUNCTION generate_sales_stage_todos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old TEXT;
  v_new TEXT;
BEGIN
  v_new := NEW.sales_stage::TEXT;
  IF TG_OP = 'INSERT' THEN
    v_old := NULL;
  ELSE
    v_old := OLD.sales_stage::TEXT;
    IF v_old = v_new THEN RETURN NEW; END IF;
  END IF;

  CASE v_new
    WHEN 'received' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 1차 미팅 일정 잡기', 3, v_new, 'deal');

    WHEN 'meeting_1st' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 회의록 업로드', 1, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 카톡방 개설', 1, v_new, 'deal');

    -- 제안 이후는 추후 확정 (현재 기존 항목 유지)
    WHEN 'proposal' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 제안서 작성·발송', 3, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 견적서 작성', 3, v_new, 'deal');

    WHEN 'contract' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 계약서 작성', 3, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 계약 조건 확정', 5, v_new, 'deal');

    WHEN 'kickoff' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 킥오프 미팅 일정', 3, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — HVP 수수료 정산 등록', 7, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 기업 자료 요청(사업계획서/재무)', 3, v_new, 'deal');
    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

-- ── 4. HVP 온보딩 단계 트리거 (신청/결제) ─────────────────
CREATE OR REPLACE FUNCTION generate_hvp_onboarding_todos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_stage TEXT;
BEGIN
  v_stage := COALESCE(NEW.onboarding_stage, 'applied');

  IF TG_OP = 'UPDATE' AND OLD.onboarding_stage IS NOT DISTINCT FROM NEW.onboarding_stage THEN
    RETURN NEW;
  END IF;

  CASE v_stage
    WHEN 'applied' THEN
      PERFORM add_general_todo(NEW.name || ' — 상담 연락', 2, 'hvp_applied', 'hvp_onboarding');
      PERFORM add_general_todo(NEW.name || ' — 150만원 입금 안내', 3, 'hvp_applied', 'hvp_onboarding');
    WHEN 'paid' THEN
      PERFORM add_general_todo(NEW.name || ' — 기수 카톡방 초대', 1, 'hvp_paid', 'hvp_onboarding');
      PERFORM add_general_todo(NEW.name || ' — 토요일 교육 일정·자료 안내', 2, 'hvp_paid', 'hvp_onboarding');
    ELSE
      NULL; -- 교육이수/파트너/거절 단계는 자동 To-do 없음
  END CASE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hvp_onboarding_ins ON hvp_applications;
CREATE TRIGGER trg_hvp_onboarding_ins
  AFTER INSERT ON hvp_applications
  FOR EACH ROW EXECUTE FUNCTION generate_hvp_onboarding_todos();

DROP TRIGGER IF EXISTS trg_hvp_onboarding_upd ON hvp_applications;
CREATE TRIGGER trg_hvp_onboarding_upd
  AFTER UPDATE OF onboarding_stage ON hvp_applications
  FOR EACH ROW EXECUTE FUNCTION generate_hvp_onboarding_todos();
