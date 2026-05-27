-- ============================================================
-- HEIM ERP — 초기 시드 데이터 (테스트용)
-- ============================================================
-- ⚠️ 실행 전 조건:
--   Dashboard > Authentication > Users 에서 'admin@heimvi.com' 계정을 미리 생성
--   (handle_new_user 트리거가 profiles에 행을 자동 생성함)
--
-- 이 파일은 여러 번 실행해도 안전합니다 (기존 시드 삭제 후 재삽입).

-- ============================================================
-- 0. 기존 시드 데이터 정리 (재실행 안전)
-- ============================================================
DELETE FROM companies WHERE name IN (
  '㈜그린텍', '㈜에듀랩', '㈜핀테크솔루션', '㈜모빌리티랩', '㈜헬스링크', '㈜로보케어'
);
DELETE FROM hvp WHERE name IN ('김민준', '이서연', '박지훈', '정수아', '최하늘');
DELETE FROM hvp_applications WHERE email IN ('gd.hong@example.com', 'newapply@example.com');
DELETE FROM tips_operators WHERE name IN ('블루포인트파트너스', '퓨처플레이', '카이트창업가재단');
DELETE FROM hvp_field_definitions WHERE field_key = 'interest';

-- ============================================================
-- 1. 관리자 승격 (admin@heimvi.com이 미리 가입돼 있어야 함)
-- ============================================================
UPDATE profiles
SET role = 'admin', name = '하임 관리자'
WHERE email = 'admin@heimvi.com';

-- ============================================================
-- 2. HVP (영업자) 시드 - 5명
-- ============================================================
INSERT INTO hvp (name, phone, email, organization, cohort, channel, referrer, applied_at, completed_at, status, default_fee_rate)
VALUES
  ('김민준', '010-1111-2222', 'mj.kim@example.com',  '㈜벤처스',   '5기', '카카오톡 수신', '박OO', '2024-12-15'::date, '2025-01-18'::date, 'active',   0.200),
  ('이서연', '010-3333-4444', 'sy.lee@example.com',  '프리랜서',   '4기', '인스타그램',    '없음', '2024-08-20'::date, '2024-09-07'::date, 'active',   0.220),
  ('박지훈', '010-5555-6666', 'jh.park@example.com', '㈜인베스트', '5기', '이메일 수신',   '김OO', '2024-12-10'::date, '2025-01-18'::date, 'active',   0.200),
  ('정수아', '010-7777-8888', 'sa.jung@example.com', '㈜그로스',   '3기', '카카오톡 수신', '이OO', '2024-04-22'::date, '2024-05-11'::date, 'inactive', 0.200),
  ('최하늘', '010-9999-0000', 'hn.choi@example.com', '㈜브릿지',   '4기', '기타',          '정OO', '2024-08-25'::date, '2024-09-07'::date, 'active',   0.200);

-- ============================================================
-- 3. 기업 시드 - 6개 (각 단계별로 분포)
-- ============================================================
INSERT INTO companies (
  name, address, ceo_name, phone, email, main_item, founded_at,
  last_year_revenue, inquiry_purpose, hvp_id, sales_stage, consulting_stage,
  program_grade, proposal_amount, fee_rate, received_at, contracted_at, started_at,
  submitter_name, submitter_phone, submitter_email
) VALUES
  ('㈜그린텍',         '부산광역시 해운대구',           '이지원',  '010-1234-5678', 'jw.lee@greentech.kr',
    '생분해성 포장재 제조 (PLA + 옥수수전분 기반)', '2023-06-15'::date,
    320, 'TIPS 선정 컨설팅',          (SELECT id FROM hvp WHERE name = '김민준'),
    'kickoff'::sales_stage,     'ir_deck'::consulting_stage,
    'premium'::program_grade,   1500, 0.200, '2026-04-12'::date, '2026-04-10'::date, '2026-04-12'::date,
    '김민준', '010-1111-2222', 'mj.kim@example.com'),

  ('㈜에듀랩',         '서울특별시 강남구',             '김에듀',  '010-2345-6789', 'edu@edulab.kr',
    '초중등 AI 튜터링 플랫폼',                   '2024-02-01'::date,
    180, '시리즈A 준비 컨설팅',       (SELECT id FROM hvp WHERE name = '김민준'),
    'contract'::sales_stage,    NULL,
    'basic'::program_grade,     1000, 0.200, '2026-04-28'::date, NULL, NULL,
    '김민준', '010-1111-2222', 'mj.kim@example.com'),

  ('㈜핀테크솔루션',   '서울특별시 영등포구',           '정핀텍',  '010-3456-7890', 'fin@fintech.kr',
    'B2B 정산 자동화 SaaS',                       '2022-11-10'::date,
    850, 'TIPS 선정 컨설팅',          (SELECT id FROM hvp WHERE name = '김민준'),
    'kickoff'::sales_stage,     'tips_review'::consulting_stage,
    'premium'::program_grade,   1500, 0.200, '2026-03-15'::date, '2026-03-20'::date, '2026-03-25'::date,
    '김민준', '010-1111-2222', 'mj.kim@example.com'),

  ('㈜모빌리티랩',     '인천광역시 연수구',             '박모빌',  '010-4567-8901', 'mobi@mobility.kr',
    '도심 라스트마일 모빌리티 (전기 자전거 공유)', '2023-09-20'::date,
    420, '투자유치 컨설팅',           (SELECT id FROM hvp WHERE name = '박지훈'),
    'proposal'::sales_stage,    NULL,
    'premium'::program_grade,   1500, 0.200, '2026-05-08'::date, NULL, NULL,
    '박지훈', '010-5555-6666', 'jh.park@example.com'),

  ('㈜헬스링크',       '서울특별시 강남구 역삼동',      '최헬스',  '010-5678-9012', 'hl@healthlink.kr',
    '만성질환 환자용 디지털 헬스 플랫폼',         '2024-01-05'::date,
    120, '초기 검토 및 TIPS 가능성',  (SELECT id FROM hvp WHERE name = '김민준'),
    'meeting_1st'::sales_stage, NULL,
    NULL,                       NULL, 0.200, '2026-05-20'::date, NULL, NULL,
    '김민준', '010-1111-2222', 'mj.kim@example.com'),

  ('㈜로보케어',       '서울특별시 송파구',             '이로보',  '010-6789-0123', 'robo@robocare.kr',
    '시니어 케어 로봇',                           '2024-08-10'::date,
    0,   '신규 컨설팅 의뢰',          (SELECT id FROM hvp WHERE name = '김민준'),
    'received'::sales_stage,    NULL,
    NULL,                       NULL, 0.200, '2026-05-24'::date, NULL, NULL,
    '김민준', '010-1111-2222', 'mj.kim@example.com');

-- ============================================================
-- 4. 계약·수수료 (착수 기업만)
-- ============================================================
INSERT INTO contracts (company_id, contracted_at, total_amount, hvp_id, hvp_fee_rate, payment_status, paid_at)
SELECT c.id, c.contracted_at, c.proposal_amount, c.hvp_id, c.fee_rate,
       CASE WHEN c.name = '㈜핀테크솔루션' THEN 'paid'::contract_payment_status
            ELSE 'scheduled'::contract_payment_status END,
       CASE WHEN c.name = '㈜핀테크솔루션' THEN '2026-04-01'::date ELSE NULL END
FROM companies c
WHERE c.sales_stage = 'kickoff' AND c.proposal_amount IS NOT NULL;

-- ============================================================
-- 5. HVP 신청서 (Tally로 들어온 신규 신청 예시)
-- ============================================================
INSERT INTO hvp_applications (name, organization, phone, email, motivation, channel, referrer, status)
VALUES
  ('홍길동', '㈜스타트업', '010-1010-2020', 'gd.hong@example.com',
   '스타트업 컨설팅에 관심이 많아 HVP에 지원합니다.', '카카오톡 수신', '김민준',     'new'),
  ('나신청',  NULL,        '010-3030-4040', 'newapply@example.com',
   '투자 분야 진출을 위해 교육 받고 싶습니다.',         '인스타그램',    '없음',       'reviewing');

-- ============================================================
-- 6. 미팅 시드 (㈜그린텍의 1차·2차 미팅)
-- ============================================================
INSERT INTO meetings (company_id, sequence, title, meeting_date, attendees, body, ai_summary, ai_summary_at)
SELECT c.id, '1차', '초기 미팅', '2026-04-15'::date,
  '이지원(대표), 김민준(HVP)',
  '회사 소개 및 TIPS 컨설팅 가능성 논의. 매출 300백만원, 시드 투자 1억 보유. 친환경 소재 시장 진입 단계.',
  '초기 미팅에서 회사 소개와 TIPS 컨설팅 적합성을 확인. 다음 미팅에서 IR Deck 초안 검토 예정.',
  '2026-04-15 18:00+09'::timestamptz
FROM companies c WHERE c.name = '㈜그린텍'
UNION ALL
SELECT c.id, '2차', 'IR Deck 검토 미팅', '2026-05-22'::date,
  '이지원(대표), 김민준(HVP), 정수정(컨설턴트)',
  'IR Deck 초안 리뷰. 문제 정의 슬라이드 보강 필요. 시장 규모는 IBK 자료 기준으로 재산정. TIPS 운영사 매칭은 6월 1주 목표.',
  '문제 정의 슬라이드 보강 필요. 시장 규모는 IBK 자료 기준으로 다시 산정. 다음 미팅 5/30 예정. TIPS 운영사 매칭은 6월 1주 목표.',
  '2026-05-22 19:00+09'::timestamptz
FROM companies c WHERE c.name = '㈜그린텍';

-- ============================================================
-- 7. To-do 시드 (㈜그린텍 + ㈜로보케어 자동 생성 예시)
-- ============================================================
INSERT INTO todos (company_id, title, description, due_date, status, auto_generated, trigger_stage)
SELECT c.id, 'IR Deck v3 작성', NULL, '2026-05-30'::date, 'in_progress'::todo_status, false, NULL
FROM companies c WHERE c.name = '㈜그린텍'
UNION ALL SELECT c.id, '시장 규모 자료 수집', '이지원 대표 직접 진행', '2026-05-27'::date, 'pending'::todo_status, false, NULL
FROM companies c WHERE c.name = '㈜그린텍'
UNION ALL SELECT c.id, '착수 미팅 일정 잡기', NULL, '2026-04-13'::date, 'done'::todo_status, true, 'kickoff'
FROM companies c WHERE c.name = '㈜그린텍'
UNION ALL SELECT c.id, '5기 카톡방 초대 (김민준)', NULL, '2026-04-13'::date, 'done'::todo_status, true, 'received'
FROM companies c WHERE c.name = '㈜그린텍'
UNION ALL SELECT c.id, '㈜로보케어 1차 미팅 일정 잡기', '오늘 마감', CURRENT_DATE, 'pending'::todo_status, true, 'received'
FROM companies c WHERE c.name = '㈜로보케어';

-- ============================================================
-- 8. HVP 커스텀 필드 예시 (관심 분야)
-- ============================================================
INSERT INTO hvp_field_definitions (field_key, label, field_type, description, display_order)
VALUES ('interest', '관심 분야', 'text'::custom_field_type, 'HVP가 주력하는 산업 분야', 1);

UPDATE hvp SET custom_fields = jsonb_set(custom_fields, '{interest}', '"바이오/헬스"'::jsonb) WHERE name = '김민준';
UPDATE hvp SET custom_fields = jsonb_set(custom_fields, '{interest}', '"에듀테크"'::jsonb)     WHERE name = '이서연';
UPDATE hvp SET custom_fields = jsonb_set(custom_fields, '{interest}', '"SaaS/B2B"'::jsonb)     WHERE name = '정수아';

-- ============================================================
-- 9. TIPS 운영사 시드
-- ============================================================
INSERT INTO tips_operators (name, contact_person, email, focus_area, notes)
VALUES
  ('블루포인트파트너스', '담당자A', 'a@bluepoint.kr',   '딥테크 / 바이오', NULL),
  ('퓨처플레이',         '담당자B', 'b@futureplay.co',  'SaaS / AI',       NULL),
  ('카이트창업가재단',   '담당자C', 'c@kite.kr',        '제조 / 하드웨어', NULL);

-- ============================================================
-- 확인 (참고용 - 실행하지 않아도 됨)
-- ============================================================
-- SELECT COUNT(*) AS hvp_count FROM hvp;
-- SELECT COUNT(*) AS company_count FROM companies;
-- SELECT COUNT(*) AS contract_count FROM contracts;
-- SELECT COUNT(*) AS meeting_count FROM meetings;
-- SELECT COUNT(*) AS todo_count FROM todos;
-- SELECT email, role FROM profiles WHERE role = 'admin';
