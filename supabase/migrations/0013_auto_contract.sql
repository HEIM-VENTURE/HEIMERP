-- ============================================================
-- HEIM ERP — 단계 'contract' 진입 시 계약 row 자동 생성
-- ============================================================
-- companies.sales_stage 가 'contract' 로 바뀌면 (또는 INSERT 시점에 'contract' 이면)
-- contracts 에 row 한 줄 미리 만들어둔다 — admin 이 금액·HVP 정보 채우러 들어옴.
--
-- 중복 방지: 같은 company_id 의 contracts 가 이미 있으면 만들지 않음.
-- total_amount 는 companies.proposal_amount 가 있으면 그걸 쓰고, 없으면 0.
-- hvp_id 는 companies.hvp_id 가 있으면 가져옴.
-- hvp_fee_rate 는 companies.fee_rate 있으면 (0~1 사이 값으로 가정) 가져오고, 없으면 default 0.2.

CREATE OR REPLACE FUNCTION auto_create_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing INT;
  v_rate NUMERIC(4,3);
BEGIN
  -- UPDATE 인 경우 단계가 바뀐 게 아니면 skip
  IF TG_OP = 'UPDATE' THEN
    IF OLD.sales_stage = NEW.sales_stage THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.sales_stage <> 'contract' THEN
    RETURN NEW;
  END IF;

  -- 이미 contracts 가 있으면 skip
  SELECT COUNT(*) INTO v_existing FROM contracts WHERE company_id = NEW.id;
  IF v_existing > 0 THEN
    RETURN NEW;
  END IF;

  -- fee_rate normalize: companies.fee_rate 는 NUMERIC(5,2) (백분율 가능성), 0~1 사이로 변환
  v_rate := COALESCE(NEW.fee_rate, 0.200);
  IF v_rate > 1 THEN
    v_rate := v_rate / 100.0;
  END IF;
  IF v_rate < 0 OR v_rate > 1 THEN
    v_rate := 0.200;
  END IF;

  INSERT INTO contracts (
    company_id,
    contracted_at,
    total_amount,
    hvp_id,
    hvp_fee_rate,
    payment_status,
    notes
  ) VALUES (
    NEW.id,
    COALESCE(NEW.contracted_at, CURRENT_DATE),
    COALESCE(NEW.proposal_amount, 0),
    NEW.hvp_id,
    v_rate,
    'scheduled',
    '단계 진입 시 자동 생성'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_contract_ins ON companies;
CREATE TRIGGER trg_auto_contract_ins
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION auto_create_contract();

DROP TRIGGER IF EXISTS trg_auto_contract_upd ON companies;
CREATE TRIGGER trg_auto_contract_upd
  AFTER UPDATE OF sales_stage ON companies
  FOR EACH ROW EXECUTE FUNCTION auto_create_contract();
