-- ============================================================
-- HEIM ERP — 결제 고객 ↔ 기업 마스터 자동 매칭
-- ============================================================
-- 결제 고객 45개 중 22개는 companies와 이름으로 매칭 가능.
-- 나머지 23개는 UI에서 사장님이 수동으로 매칭.
--
-- 매칭 방법: 이름 정규화(전각괄호·공백·주식회사 접미어 제거) 후 정확/부분 일치.
-- companies.name이 없으면 UPDATE는 NULL 반환 → company_id는 그대로 NULL.
-- ============================================================

UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '파인드잇' LIMIT 1) WHERE no = 2;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '디에이블' LIMIT 1) WHERE no = 3;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '펴다' LIMIT 1) WHERE no = 4;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '에이젠다' LIMIT 1) WHERE no = 5;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '에녹스' LIMIT 1) WHERE no = 6;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '처음청약' LIMIT 1) WHERE no = 7;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '나눔알파플러스' LIMIT 1) WHERE no = 8;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '뷰랩스' LIMIT 1) WHERE no = 10;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '메디벤처스' LIMIT 1) WHERE no = 11;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '비엠제이' LIMIT 1) WHERE no = 12;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '덴티버스' LIMIT 1) WHERE no = 24;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '예담라이프' LIMIT 1) WHERE no = 25;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '투비이스' LIMIT 1) WHERE no = 27;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '벨라골드' LIMIT 1) WHERE no = 28;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '실비노' LIMIT 1) WHERE no = 35;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '코피다스' LIMIT 1) WHERE no = 37;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '미라클 그룹' LIMIT 1) WHERE no = 38;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '마이닝오천' LIMIT 1) WHERE no = 39;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '무인화연구소' LIMIT 1) WHERE no = 42;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '이팜헬스케어(케어랩)' LIMIT 1) WHERE no = 43;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '컨벤져스' LIMIT 1) WHERE no = 44;
UPDATE paid_customers SET company_id = (SELECT id FROM companies WHERE name = '다보자' LIMIT 1) WHERE no = 45;
