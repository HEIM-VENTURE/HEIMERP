-- ============================================================
-- HEIM ERP — HVP 시드 + 노션 import 회사들에게 담당 HVP 할당
-- ============================================================
-- 실제 운영 시 사장님이 HVP 명단을 직접 관리(추가·수정·비활성)하면 됨.
-- 이 시드는 화면 동작 확인용 + 노션 import 데이터의 담당자 표시용.

-- 재실행 안전
DELETE FROM hvp WHERE name IN ('김민준', '이서연', '박지훈', '정수아', '최하늘');

INSERT INTO hvp (name, phone, email, organization, cohort, channel, referrer, applied_at, completed_at, status, default_fee_rate)
VALUES
  ('김민준', '010-1111-2222', 'mj.kim@example.com',  '㈜벤처스',   '5기', '카카오톡 수신', '박OO', '2024-12-15'::date, '2025-01-18'::date, 'active',   0.200),
  ('이서연', '010-3333-4444', 'sy.lee@example.com',  '프리랜서',   '4기', '인스타그램',    '없음', '2024-08-20'::date, '2024-09-07'::date, 'active',   0.220),
  ('박지훈', '010-5555-6666', 'jh.park@example.com', '㈜인베스트', '5기', '이메일 수신',   '김OO', '2024-12-10'::date, '2025-01-18'::date, 'active',   0.200),
  ('정수아', '010-7777-8888', 'sa.jung@example.com', '㈜그로스',   '3기', '카카오톡 수신', '이OO', '2024-04-22'::date, '2024-05-11'::date, 'inactive', 0.200),
  ('최하늘', '010-9999-0000', 'hn.choi@example.com', '㈜브릿지',   '4기', '기타',          '정OO', '2024-08-25'::date, '2024-09-07'::date, 'active',   0.200);

-- ============================================================
-- 노션 import 회사들에게 담당 HVP를 임의 할당 (테스트용)
-- 실제로는 admin이 회사 상세에서 변경하시면 됨
-- ============================================================
-- 김민준에게 (착수 진행 중 핵심 회사들)
UPDATE companies SET hvp_id = (SELECT id FROM hvp WHERE name = '김민준')
WHERE name IN ('실비노', '펴다(TIPS)', '에이젠다 (TIPS)', '에녹스 (TIPS)', '뷰랩스 (TIPS)',
               '비엠제이 (TIPS)', '메디벤처스 (TIPS)', '루덴스 (TIPS)', '미라클그룹 (TIPS)',
               '브랜드지놈 (투자)', '엔드게임벤처스 (투자)', '에스플러스컴텍');

-- 박지훈에게
UPDATE companies SET hvp_id = (SELECT id FROM hvp WHERE name = '박지훈')
WHERE name IN ('디에이블', '컨벤져스(TIPS)', '나눔알파플러스 (TIPS)', '처음청약 (TIPS)',
               '코피다스 (TIPS)', '예담라이프 (TIPS)', '더파 (TIPS)', '딱', '시라노소개팅',
               '파란별티이씨', '파밀리데이터');

-- 이서연에게
UPDATE companies SET hvp_id = (SELECT id FROM hvp WHERE name = '이서연')
WHERE name IN ('헤리티지아이티 (TIPS)', '아이전스 (TIPS+투자)', '이팜헬스케어 (TIPS)',
               '투비이스 (TIPS+투자)', '벨라골드 (TIPS+투자)', '에프디에스씨 (TIPS+투자)',
               '루카스에듀테인먼트 (투자)', '마이닝5000 (TIPS+투자)', '하브루아카데미',
               '밸류오션', '르마하');

-- 최하늘에게
UPDATE companies SET hvp_id = (SELECT id FROM hvp WHERE name = '최하늘')
WHERE name IN ('더봄에이아이', '씨놀', '패링스', '벨루가', '온스퀘어', '라이브나우',
               '무인화연구소 (TIPS)', '이볼브 (TIPS)', '다보자', '신태순대표 프로젝트',
               '프라임실버케어', '투캐리앤리', '코어스테크', '라라', '메디렘',
               '윤영우 대표 스타트업', 'REALIZE RX (20260323)');

-- ============================================================
-- 확인
-- ============================================================
-- SELECT h.name AS hvp, COUNT(c.id) AS company_count
-- FROM hvp h LEFT JOIN companies c ON c.hvp_id = h.id
-- GROUP BY h.name ORDER BY company_count DESC;
