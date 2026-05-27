-- ============================================================
-- HEIM ERP — RLS (Row Level Security) 정책
-- ============================================================
-- 권한 매트릭스:
-- - admin: 전체 RW
-- - hvp: 자기 데려온 기업 / 자기 행만, 단계는 접수~1차미팅까지만 변경 가능
-- - company_member: 자기 회사 R + 자료/To-do 일부 W

-- ============================================================
-- 헬퍼 함수 (RLS 안에서 재사용)
-- ============================================================
CREATE OR REPLACE FUNCTION app_user_role()
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION app_user_hvp_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT hvp_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION app_user_company_id()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION app_is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ============================================================
-- RLS Enable
-- ============================================================
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvp                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvp_field_definitions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvp_applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_stage_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE files                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips_operators         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- hvp
-- ============================================================
CREATE POLICY hvp_admin_all ON hvp
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- HVP 자기 행 + 다른 HVP 기본 정보(이름·기수) 조회 가능
CREATE POLICY hvp_self_read ON hvp
  FOR SELECT USING (id = app_user_hvp_id() OR app_user_role() = 'hvp');

-- ============================================================
-- hvp_field_definitions
-- ============================================================
CREATE POLICY hvp_fields_read ON hvp_field_definitions
  FOR SELECT USING (true);  -- 누구나 읽기 (라벨 표시용)

CREATE POLICY hvp_fields_admin_write ON hvp_field_definitions
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- ============================================================
-- hvp_applications
-- ============================================================
CREATE POLICY hvp_apps_admin_all ON hvp_applications
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- 누구나 INSERT 가능 (Tally webhook이 anon으로 호출)
CREATE POLICY hvp_apps_public_insert ON hvp_applications
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- companies
-- ============================================================
CREATE POLICY companies_admin_all ON companies
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- HVP는 자기가 데려온 기업만 SELECT
CREATE POLICY companies_hvp_read ON companies
  FOR SELECT USING (hvp_id = app_user_hvp_id());

-- HVP는 자기 hvp_id로 INSERT만 (= 자기 기업 추가)
CREATE POLICY companies_hvp_insert ON companies
  FOR INSERT WITH CHECK (hvp_id = app_user_hvp_id());

-- HVP는 자기 기업의 기본 필드만 UPDATE.
-- 단계는 'received' → 'meeting_1st'까지만 본인이 변경 가능
CREATE POLICY companies_hvp_update ON companies
  FOR UPDATE USING (hvp_id = app_user_hvp_id())
  WITH CHECK (
    hvp_id = app_user_hvp_id() AND
    sales_stage IN ('received', 'meeting_1st')
  );

-- 기업 사용자는 자기 회사만 SELECT
CREATE POLICY companies_company_read ON companies
  FOR SELECT USING (id = app_user_company_id());

-- Tally webhook용 anon INSERT (별도 정책)
CREATE POLICY companies_webhook_insert ON companies
  FOR INSERT WITH CHECK (source = 'tally_webhook');

-- ============================================================
-- company_stage_history
-- ============================================================
CREATE POLICY stage_hist_admin_all ON company_stage_history
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY stage_hist_hvp_read ON company_stage_history
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
  );

CREATE POLICY stage_hist_company_read ON company_stage_history
  FOR SELECT USING (company_id = app_user_company_id());

-- ============================================================
-- meetings
-- ============================================================
CREATE POLICY meetings_admin_all ON meetings
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY meetings_hvp_rw ON meetings
  FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
  );

CREATE POLICY meetings_company_read ON meetings
  FOR SELECT USING (company_id = app_user_company_id());

-- ============================================================
-- todos
-- ============================================================
CREATE POLICY todos_admin_all ON todos
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY todos_hvp_rw ON todos
  FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
    OR assignee_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
    OR assignee_id = auth.uid()
  );

-- 기업은 자기 회사의 To-do 보기 + 자기에게 할당된 건 완료 처리 가능
CREATE POLICY todos_company_read ON todos
  FOR SELECT USING (company_id = app_user_company_id());

CREATE POLICY todos_company_update_status ON todos
  FOR UPDATE USING (
    company_id = app_user_company_id() AND assignee_id = auth.uid()
  );

-- ============================================================
-- files
-- ============================================================
CREATE POLICY files_admin_all ON files
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY files_hvp_rw ON files
  FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
  );

-- 기업도 자기 회사 자료 업로드 가능
CREATE POLICY files_company_rw ON files
  FOR ALL USING (company_id = app_user_company_id())
  WITH CHECK (company_id = app_user_company_id());

-- ============================================================
-- contracts
-- ============================================================
CREATE POLICY contracts_admin_all ON contracts
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- HVP는 본인 수수료 내역만 조회
CREATE POLICY contracts_hvp_read ON contracts
  FOR SELECT USING (hvp_id = app_user_hvp_id());

-- ============================================================
-- notifications
-- ============================================================
CREATE POLICY notifications_recipient_rw ON notifications
  FOR ALL USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY notifications_admin_all ON notifications
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- ============================================================
-- activity_log
-- ============================================================
CREATE POLICY activity_admin_all ON activity_log
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY activity_hvp_read ON activity_log
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE hvp_id = app_user_hvp_id())
  );

CREATE POLICY activity_company_read ON activity_log
  FOR SELECT USING (company_id = app_user_company_id());

-- ============================================================
-- tips_operators
-- ============================================================
CREATE POLICY tips_admin_all ON tips_operators
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY tips_hvp_read ON tips_operators
  FOR SELECT USING (app_user_role() = 'hvp');
