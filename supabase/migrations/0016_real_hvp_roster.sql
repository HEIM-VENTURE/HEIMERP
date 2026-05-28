-- ============================================================
-- HEIM ERP — HVP 명단을 실제 22명으로 교체 (HEIM ADS OS Firestore에서 import)
-- ============================================================
-- 기존 시드/테스트 HVP를 모두 제거하고 실제 명단으로 교체.
-- hvp_id 참조(companies / profiles / contracts / hvp_applications)는 모두
-- ON DELETE SET NULL 이라 데이터 손실 없이 연결만 해제됨(추후 재배정 필요).

DELETE FROM hvp;

INSERT INTO hvp (name, organization, phone, email, status, default_fee_rate) VALUES
  ('현기암', NULL, NULL, NULL, 'active', 0.200),
  ('김성일', '아크메디', NULL, NULL, 'active', 0.200),
  ('홍승희', NULL, NULL, NULL, 'active', 0.200),
  ('김지선', NULL, NULL, NULL, 'active', 0.200),
  ('이조원', NULL, NULL, NULL, 'active', 0.200),
  ('최수원', '마스타비즈', '010-7477-6477', NULL, 'active', 0.200),
  ('강태혁', NULL, NULL, NULL, 'active', 0.200),
  ('전승재', NULL, NULL, NULL, 'active', 0.200),
  ('안정환', 'ANP벤처스', NULL, NULL, 'active', 0.200),
  ('한지환', NULL, NULL, NULL, 'active', 0.200),
  ('장양순', '중소기업경영지원단', NULL, NULL, 'active', 0.200),
  ('김경민', '오토커넥트', NULL, NULL, 'active', 0.200),
  ('지영주', NULL, NULL, NULL, 'active', 0.200),
  ('강승민', NULL, NULL, NULL, 'active', 0.200),
  ('홍성훈', '광화문특허법률사무소', NULL, NULL, 'active', 0.200),
  ('정재훈', '중소기업경영지원단', NULL, NULL, 'active', 0.200),
  ('조대일', NULL, NULL, NULL, 'active', 0.200),
  ('남지윤', '미라클 그룹', NULL, NULL, 'active', 0.200),
  ('조성완', NULL, NULL, NULL, 'active', 0.200),
  ('이규화', '케이앤와이', NULL, NULL, 'active', 0.200),
  ('이선용', NULL, NULL, NULL, 'active', 0.200),
  ('고금상', NULL, NULL, NULL, 'active', 0.200);
