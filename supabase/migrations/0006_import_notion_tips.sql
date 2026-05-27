-- ============================================================
-- HEIM ERP — 노션 "투자&TIPS 컨설팅" 데이터 임포트
-- ============================================================
-- 출처: https://www.notion.so/2dd1fd615b80803b879ac4c937f90f4d
-- 51개 기업 (빈 템플릿 4개 제외)
-- 메타데이터만 (회사명·단계·등급·일정). 상세 정보는 추후 보완.
--
-- 매핑:
--   진행상황(노션)               → sales_stage  / consulting_stage
--   ─────────────────────────────────────────────────────────
--   미팅 및 접수                  → meeting_1st  / NULL
--   제안 및 계약중                → proposal     / NULL
--   계약완료 및 초기검토          → kickoff      / initial_review
--   TIPS 아이템 확정              → kickoff      / initial_review
--   개발자문 및 1차 사업계획 작성 → kickoff      / dev_advisory
--   IR Deck 작업                  → kickoff      / ir_deck
--   TIPS 운영사 IR                → kickoff      / tips_operator_ir
--   TIPS 심사                     → kickoff      / tips_review
--   조합 투자절차 Closing         → kickoff      / fund_closing
--   Final Closing                 → kickoff      / final_closing
--
-- 프로그램 속성:
--   Premium 프로그램 → grade=premium, proposal_amount=1500
--   Basic 프로그램   → grade=basic,   proposal_amount=1000
--   Free 프로그램    → grade=free,    proposal_amount=NULL
--
-- 재실행 안전: 노션 URL 기준 중복 제거 (notion_url을 source에 저장)

-- 같은 source의 기존 import 데이터 제거 (재실행 안전)
DELETE FROM companies WHERE source = 'notion_tips_import';

INSERT INTO companies (
  name, sales_stage, consulting_stage, program_grade, proposal_amount,
  started_at, received_at, source, notes
) VALUES
  ('실비노',                  'kickoff',     'initial_review',     'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('펴다(TIPS)',              'kickoff',     'ir_deck',            'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('디에이블',                'kickoff',     'ir_deck',            'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('하브루아카데미',          'meeting_1st', NULL,                 NULL,      NULL, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('컨벤져스(TIPS)',          'kickoff',     'ir_deck',            NULL,      NULL, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('더봄에이아이',            'meeting_1st', NULL,                 NULL,      NULL, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('씨놀',                    'meeting_1st', NULL,                 NULL,      NULL, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('에이젠다 (TIPS)',         'kickoff',     'tips_operator_ir',   'premium', 1500, '2026-04-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-11-30'),
  ('REALIZE RX (20260323)',   'meeting_1st', NULL,                 NULL,      NULL, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('헤리티지아이티 (TIPS)',   'proposal',    NULL,                 'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('아이전스 (TIPS+투자)',    'proposal',    NULL,                 'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('이팜헬스케어 (TIPS)',     'kickoff',     'ir_deck',            'basic',   1000, '2026-05-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-08-31'),
  ('패링스',                  'meeting_1st', NULL,                 'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('에녹스 (TIPS)',           'kickoff',     'ir_deck',            'premium', 1500, '2026-03-03', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-10-31'),
  ('더파 (TIPS)',             'kickoff',     'ir_deck',            'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('벨루가',                  'meeting_1st', NULL,                 'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('예담라이프 (TIPS)',       'kickoff',     'ir_deck',            'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('에프디에스씨 (TIPS+투자)','kickoff',     'tips_operator_ir',   'basic',   1000, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('온스퀘어',                'meeting_1st', NULL,                 'premium', 1500, NULL,         CURRENT_DATE, 'notion_tips_import', NULL),
  ('처음청약 (TIPS)',         'kickoff',     'tips_operator_ir',   'premium', 1500, '2026-03-02', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-09-30'),
  ('코피다스 (TIPS)',         'kickoff',     'tips_operator_ir',   'premium', 1500, '2026-02-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-09-30'),
  ('나눔알파플러스 (TIPS)',   'kickoff',     'ir_deck',            'premium', 1500, '2026-02-02', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('투비이스 (TIPS+투자)',    'kickoff',     'tips_operator_ir',   'premium', 1500, '2026-02-16', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('벨라골드 (TIPS+투자)',    'kickoff',     'tips_operator_ir',   'premium', 1500, '2026-02-03', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-12-31'),
  ('에스플러스컴텍',          'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('파란별티이씨',            'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('파밀리데이터',            'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('밸류오션',                'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('르마하',                  'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('프라임실버케어',          'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('투캐리앤리',              'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('코어스테크',              'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('라라',                    'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('메디렘',                  'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('윤영우 대표 스타트업',    'meeting_1st', NULL,                 'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('브랜드지놈 (투자)',       'kickoff',     'final_closing',      'basic',   1000, '2026-01-16', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('라이브나우',              'meeting_1st', NULL,                 'premium', 1500, '2026-01-16', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('루카스에듀테인먼트 (투자)','kickoff',    'tips_operator_ir',   'basic',   1000, '2026-01-16', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('루덴스 (TIPS)',           'kickoff',     'final_closing',      'basic',   1000, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-08-06'),
  ('딱',                      'kickoff',     'initial_review',     'basic',   1000, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('무인화연구소 (TIPS)',     'kickoff',     'final_closing',      'basic',   1000, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('이볼브 (TIPS)',           'kickoff',     'final_closing',      'free',    NULL, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('마이닝5000 (TIPS+투자)',  'kickoff',     'tips_operator_ir',   'free',    NULL, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('뷰랩스 (TIPS)',           'kickoff',     'fund_closing',       'premium', 1500, '2025-12-25', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('메디벤처스 (TIPS)',       'kickoff',     'tips_operator_ir',   'premium', 1500, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('비엠제이 (TIPS)',         'kickoff',     'fund_closing',       'premium', 1500, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('다보자',                  'kickoff',     'tips_operator_ir',   'basic',   1000, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('신태순대표 프로젝트',     'kickoff',     'initial_review',     'free',    NULL, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('시라노소개팅',            'kickoff',     'initial_review',     'basic',   1000, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30'),
  ('미라클그룹 (TIPS)',       'kickoff',     'ir_deck',            'basic',   1000, '2025-12-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-07-31'),
  ('엔드게임벤처스 (투자)',   'kickoff',     'final_closing',      'free',    NULL, '2025-11-01', CURRENT_DATE, 'notion_tips_import', '종료 예정: 2026-06-30');

-- 확인: 임포트된 기업 수
-- SELECT COUNT(*) FROM companies WHERE source = 'notion_tips_import';   -- 51
-- SELECT consulting_stage, COUNT(*) FROM companies WHERE source = 'notion_tips_import' GROUP BY consulting_stage;
