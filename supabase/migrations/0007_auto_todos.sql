-- ============================================================
-- HEIM ERP — 단계 변경 시 자동 To-do 생성 트리거
-- ============================================================
-- 회사가 새로 INSERT되거나 sales_stage / consulting_stage가 바뀌면
-- 정해진 룰에 따라 todos를 자동 생성.
--
-- 룰 (CLAUDE.md 매핑 표):
--   영업단계 변경:
--     received     → "OO기수 카톡방 초대", "신규 접수 기업 검토", "1차 미팅 일정 잡기"
--     meeting_1st  → "회의록 작성", "내부 검토 회의"
--     proposal     → "제안서 작성·발송", "견적서 작성"
--     contract     → "계약서 작성", "계약 조건 확정"
--     kickoff      → "킥오프 미팅 일정", "HVP 수수료 정산 등록", "초기 검토 시작"
--
--   컨설팅단계 변경:
--     ir_deck           → "IR Deck 초안", "내부 리뷰"
--     tips_operator_ir  → "TIPS 운영사 매칭", "IR 일정 잡기"
--     tips_review       → "심사 결과 추적"
--     final_closing     → "HVP 수수료 지급", "기업 모니터링 시작"

-- ============================================================
-- 헬퍼: 자동 To-do 1건 INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION add_auto_todo(
  p_company_id BIGINT,
  p_title TEXT,
  p_due_days INT,
  p_trigger_stage TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO todos (company_id, title, due_date, status, auto_generated, trigger_stage)
  VALUES (
    p_company_id,
    p_title,
    CURRENT_DATE + p_due_days,
    'pending'::todo_status,
    true,
    p_trigger_stage
  );
END;
$$;

-- ============================================================
-- 영업 단계 변경 시 자동 To-do
-- ============================================================
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

  -- INSERT인 경우 또는 단계가 실제로 바뀐 경우만
  IF TG_OP = 'INSERT' THEN
    v_old := NULL;
  ELSE
    v_old := OLD.sales_stage::TEXT;
    IF v_old = v_new THEN
      RETURN NEW;
    END IF;
  END IF;

  -- 단계별 룰
  CASE v_new
    WHEN 'received' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 기수 카톡방 초대 (영업자 ' || COALESCE(NEW.submitter_name, '미상') || ')', 1, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 신규 접수 검토', 2, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 1차 미팅 일정 잡기', 3, v_new);

    WHEN 'meeting_1st' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 회의록 작성', 1, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 내부 검토 회의', 3, v_new);

    WHEN 'proposal' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 제안서 작성·발송', 3, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 견적서 작성', 3, v_new);

    WHEN 'contract' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 계약서 작성', 3, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 계약 조건 확정', 5, v_new);

    WHEN 'kickoff' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 킥오프 미팅 일정', 3, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — HVP 수수료 정산 등록', 7, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 초기 검토 시작', 5, v_new);
    ELSE
      -- 알 수 없는 단계는 To-do 안 만듦
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 컨설팅 단계 변경 시 자동 To-do
-- ============================================================
CREATE OR REPLACE FUNCTION generate_consulting_stage_todos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new TEXT;
BEGIN
  IF NEW.consulting_stage IS NULL THEN
    RETURN NEW;
  END IF;

  v_new := NEW.consulting_stage::TEXT;

  -- 단계가 실제로 바뀐 경우만 (INSERT의 경우도 포함하되, 같은 값이면 skip)
  IF TG_OP = 'UPDATE' AND OLD.consulting_stage IS NOT DISTINCT FROM NEW.consulting_stage THEN
    RETURN NEW;
  END IF;

  CASE v_new
    WHEN 'ir_deck' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — IR Deck 초안 작성', 5, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 내부 리뷰', 7, v_new);

    WHEN 'tips_operator_ir' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — TIPS 운영사 매칭', 5, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — IR 일정 잡기', 7, v_new);

    WHEN 'tips_review' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — TIPS 심사 결과 추적', 14, v_new);

    WHEN 'final_closing' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — HVP 수수료 지급', 7, v_new);
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 기업 모니터링 시작', 14, v_new);
    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 트리거 설치
-- ============================================================

-- 영업 단계 (INSERT + UPDATE OF sales_stage)
DROP TRIGGER IF EXISTS trg_sales_stage_todos_ins ON companies;
CREATE TRIGGER trg_sales_stage_todos_ins
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION generate_sales_stage_todos();

DROP TRIGGER IF EXISTS trg_sales_stage_todos_upd ON companies;
CREATE TRIGGER trg_sales_stage_todos_upd
  AFTER UPDATE OF sales_stage ON companies
  FOR EACH ROW EXECUTE FUNCTION generate_sales_stage_todos();

-- 컨설팅 단계 (UPDATE OF consulting_stage)
DROP TRIGGER IF EXISTS trg_consulting_stage_todos ON companies;
CREATE TRIGGER trg_consulting_stage_todos
  AFTER UPDATE OF consulting_stage ON companies
  FOR EACH ROW EXECUTE FUNCTION generate_consulting_stage_todos();

-- ============================================================
-- 확인 쿼리 (실행 후 참고용)
-- ============================================================
-- SELECT title, due_date, trigger_stage FROM todos WHERE auto_generated = true ORDER BY created_at DESC LIMIT 20;
