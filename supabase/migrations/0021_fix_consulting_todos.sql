-- ============================================================
-- HEIM ERP — 컨설팅 단계 변경 시 "function add_auto_todo(...) is not unique" 에러 수정
-- ============================================================
-- 증상: 컨설팅 단계를 ir_deck / tips_operator_ir / tips_review / final_closing
--      으로 바꾸려 하면 "function add_auto_todo(bigint, text, integer, text)
--      is not unique" 에러로 단계 변경 자체가 실패.
--
-- 원인: 0007에서 4-arg add_auto_todo 를, 0019에서 5-arg(category 추가) 버전을
--      각각 CREATE 하면서 둘 다 DB에 남음. 0007의 트리거가 4-arg로 호출하면
--      4-arg 매치 + 5-arg(DEFAULT 'deal') 매치가 동시에 가능해 모호.
--
-- 수정:
--   1) 4-arg add_auto_todo 명시적으로 DROP
--   2) generate_consulting_stage_todos 트리거 함수를 5-arg 호출(category='deal')로 재정의

-- ── 1. 옛 4-arg 함수 제거 ────────────────────────────────────
DROP FUNCTION IF EXISTS add_auto_todo(BIGINT, TEXT, INT, TEXT);

-- ── 2. 컨설팅 트리거 함수를 5-arg 호출로 재정의 ────────────
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

  IF TG_OP = 'UPDATE' AND OLD.consulting_stage IS NOT DISTINCT FROM NEW.consulting_stage THEN
    RETURN NEW;
  END IF;

  CASE v_new
    WHEN 'ir_deck' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — IR Deck 초안 작성', 5, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 내부 리뷰', 7, v_new, 'deal');

    WHEN 'tips_operator_ir' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — TIPS 운영사 매칭', 5, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — IR 일정 잡기', 7, v_new, 'deal');

    WHEN 'tips_review' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — TIPS 심사 결과 추적', 14, v_new, 'deal');

    WHEN 'final_closing' THEN
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — HVP 수수료 지급', 7, v_new, 'deal');
      PERFORM add_auto_todo(NEW.id, NEW.name || ' — 기업 모니터링 시작', 14, v_new, 'deal');
    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

-- 트리거 자체는 0007에서 이미 설치되어 있으므로 재설치 불필요.
-- (CREATE OR REPLACE FUNCTION 이 함수 본문만 교체)
