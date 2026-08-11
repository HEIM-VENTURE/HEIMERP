-- ============================================================
-- HEIM ERP — 결제 고객 리스트 (엑셀 이관)
-- ============================================================
-- 대표님 요청: "결제고객 리스트_20260730_최종.xlsx" 를 ERP 안에 넣어 현황 파악.
-- 우선 엑셀 컬럼 그대로 옮긴다. companies 테이블(87개)과의 매칭은 별도 스텝.
--
-- 컬럼 매핑:
--   No.                → no
--   회사명             → company_name
--   결제여부           → is_paid (O=true, X=false, blank=null)
--   신규법인 설립      → new_corp_setup (O/? 값이 그대로 들어옴)
--   신규회사명         → new_company_name
--   타깃 프로그램      → target_program (팁스,립스,투자 콤마 구분)
--   긴급도             → urgency (1|2|3)
--   식별이름           → legal_name (법인등기명)
--   설립일             → established_at (TEXT — '설립전' 같은 문자열도 존재)
--   직원 수            → headcount (TEXT — '법인 1명(개인사업자 4명)' 같은 서술형)
--   IR Deck (팁스)     → ir_deck_tips  (O / '2주후' 등 상태)
--   IR Deck (립스)     → ir_deck_lips
--   1차 데모데이 x2    → demoday_1_a, demoday_1_b   (원본 헤더 중복 — 사장님이 나중에 의미 명확화)
--   2차 데모데이 x2    → demoday_2_a, demoday_2_b
--   오프라인           → offline
-- ============================================================

CREATE TABLE paid_customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no                INT UNIQUE,
  company_name      TEXT NOT NULL,
  is_paid           BOOLEAN,
  new_corp_setup    TEXT,
  new_company_name  TEXT,
  target_program    TEXT,
  urgency           INT CHECK (urgency IS NULL OR urgency BETWEEN 1 AND 5),
  legal_name        TEXT,
  established_at    TEXT,
  headcount         TEXT,
  ir_deck_tips      TEXT,
  ir_deck_lips      TEXT,
  demoday_1_a       TEXT,
  demoday_1_b       TEXT,
  demoday_2_a       TEXT,
  demoday_2_b       TEXT,
  offline           TEXT,
  memo              TEXT,                    -- 내부 메모 (사장님이 추가 정보 기록 시)
  company_id        BIGINT REFERENCES companies(id) ON DELETE SET NULL,  -- 향후 companies 매칭용
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paid_customers_urgency      ON paid_customers(urgency);
CREATE INDEX idx_paid_customers_is_paid      ON paid_customers(is_paid);
CREATE INDEX idx_paid_customers_target       ON paid_customers(target_program);
CREATE INDEX idx_paid_customers_company_name ON paid_customers(company_name);

CREATE TRIGGER set_timestamp_paid_customers
  BEFORE UPDATE ON paid_customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- ─────────────────────────────────────────────
-- RLS: admin만 select/update
-- ─────────────────────────────────────────────
ALTER TABLE paid_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY paid_customers_admin_read
  ON paid_customers FOR SELECT
  TO authenticated
  USING (app_user_role() = 'admin');

CREATE POLICY paid_customers_admin_write
  ON paid_customers FOR ALL
  TO authenticated
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON paid_customers TO authenticated;
GRANT ALL ON paid_customers TO service_role;

COMMENT ON TABLE paid_customers IS
  '결제고객 리스트 (2026-07-30 엑셀 이관). 대표님 현황 파악용. companies 매칭은 향후.';

-- ============================================================
-- 초기 데이터 45개 (2026-07-30 엑셀 기준)
-- ============================================================
INSERT INTO paid_customers (no, company_name, is_paid, new_corp_setup, new_company_name, target_program, urgency, legal_name, established_at, headcount, ir_deck_tips, ir_deck_lips, demoday_1_a, demoday_1_b, demoday_2_a, demoday_2_b, offline) VALUES
(1, '주식회사금마니', TRUE, 'O', NULL, '팁스', 1, '주식회사금마니', '2025-03-11', '6명', 'O', NULL, NULL, NULL, NULL, NULL, NULL),
(2, '파인드잇', TRUE, NULL, NULL, '팁스,립스', 1, '주식회사 리베이스컴', '2022-04-25', '2명', '2주후', NULL, NULL, NULL, NULL, NULL, NULL),
(3, '주식회사디에이블', TRUE, NULL, NULL, '팁스', 1, '주식회사 디에이블', '2021-02-03', '8명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, '주식회사펴다', TRUE, NULL, NULL, '팁스', 1, '주식회사 펴다', '2022-01-01', '9명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, '(주)에이젠다', TRUE, NULL, NULL, '팁스', 1, '（주）에이젠다', '2024-10-01', '4명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, '주식회사에녹스', TRUE, NULL, NULL, '팁스,립스', 1, '주식회사 에녹스', '2022-08-01', '1명', 'O', '1주후', NULL, NULL, NULL, NULL, NULL),
(7, '(주)처음청약', TRUE, NULL, NULL, '팁스', 1, '（주）처음청약', '2023-07-31', '6명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, '（주）나눔알파플러스', TRUE, NULL, NULL, '팁스,립스', 1, '(주)나눔알파플러스', '2025-07-18', '3명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, '네온플로우', TRUE, '?', NULL, '팁스,립스', 1, '이규화（프로텍트）', '2024-05-30', '2명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, '뷰랩스', TRUE, NULL, NULL, '팁스', 1, '주식회사 뷰랩스', '2021-05-29', '3명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, '메디벤처스(김경록)', TRUE, NULL, NULL, '팁스,립스', 1, '김경록', '2025-04-22(기린컴퍼니)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, '주식회사비엠제이', TRUE, NULL, NULL, '팁스,립스', 1, '주식회사 비엠제이', '2023-09-22', '5명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, '김지혜', TRUE, '?', NULL, '팁스', 1, NULL, '2001-10-22', '1명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, '그릿 BD', FALSE, NULL, NULL, '립스', 1, NULL, '2024-05-08', '2명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, '에르', TRUE, NULL, NULL, '립스', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, '주식회사더쉼', TRUE, NULL, NULL, '립스', 2, '주식회사 더쉼', '2023-04-07', '10명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, '주식회사이엘씨', TRUE, 'O', NULL, '투자', 2, '주식회사이엘씨', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, '윤도담', TRUE, 'O', NULL, '팁스', 2, '윤영선', '2026-08-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, '모덴블랑', TRUE, NULL, NULL, '팁스', 2, '이민혁', '2025-03-01', '법인 1명(개인사업자 4명)', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, '(주)베이브김태', TRUE, NULL, NULL, '팁스', 2, '（주）베이브', '2022-07-28', '2명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, '(주)주주마스터', TRUE, NULL, NULL, '투자', 2, '(주)주주마스터', '2021-02-05', '2명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, '이구희', TRUE, NULL, NULL, '팁스', 2, '이구희', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, '루멘큐브랩', TRUE, '?', NULL, '팁스', 2, '김상명', '2025-11-24', '10명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, '주식회사덴티버스', TRUE, 'O', NULL, '팁스', 2, '주식회사 덴티버스', '2025-05-19', '6명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, '예담라이프(주)', TRUE, NULL, NULL, '팁스,립스', 2, '예담라이프（주）', '2023-01-02', '4명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, '최대희', TRUE, 'O', '더파', '팁스', 2, '최대희', '2026-04-17', '4명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, '주식회사투비이스', TRUE, NULL, NULL, '팁스,투자', 2, '주식회사 투비이스', '2021-05-14', '8명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, '주식회사벨라골드', TRUE, 'O', NULL, '팁스,투자', 2, '주식회사 벨라골드', '2021-04-30', '14명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, '루카스에듀테인먼트', TRUE, NULL, NULL, '팁스', 2, '（주）루카스에듀테인', '2022-06-08', '2명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, '주식회사루덴스', TRUE, NULL, NULL, '팁스', 2, '주식회사루덴스', '2023-12-21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, '로지벤', TRUE, NULL, NULL, '팁스', 2, NULL, '2025-03-06', '13명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, '더퍼스트팀', TRUE, 'O', '설립예정', '팁스', 2, NULL, '2018-09-11', '10명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, '큐앤에이에듀', TRUE, 'O', '설립예정', '팁스', 2, NULL, '설립전', '설립전', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, '엘엠씨', FALSE, NULL, NULL, '립스,투자', 2, NULL, '2026-01-22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, '(주)실비노', TRUE, 'O', '설립예정', '팁스,립스', 3, '(주)실비노', '2021-07-13', '4명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, '주식회사디에스씨홀딩', TRUE, NULL, NULL, '투자', 3, '주식회사 디에스씨', NULL, '1명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, '(주)코피다스', TRUE, NULL, NULL, '팁스', 3, '（주）코피다스', '2025-09-18', '3명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, '미라클', TRUE, NULL, NULL, '팁스', 3, NULL, '2024-03-18', '2명(2024년 기준)', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, '마이닝 오천', FALSE, NULL, NULL, '팁스', 3, NULL, '2023-04-21', '19명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, '할로제로', FALSE, NULL, NULL, '투자', 3, NULL, '2025-12-08', '3명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, '티랩컴퍼니', FALSE, NULL, NULL, '팁스', 3, NULL, '2026-01-08', '1명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, '무인화연구소', TRUE, NULL, NULL, '팁스', 3, NULL, '2022-11-30', '3명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, '이팜헬스케어', TRUE, 'O', '스마트케어랩', '팁스', 3, NULL, '2020-03-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, '컨벤져스', FALSE, NULL, NULL, '팁스', 3, NULL, '2025-09-10', '7명', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, '다보자', TRUE, NULL, NULL, '팁스', 3, NULL, '2023-04-01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
