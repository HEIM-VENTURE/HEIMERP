-- ============================================================
-- HEIM ERP — 테스트 HVP 계정: yoona.heo04@gmail.com (허유나)
-- ============================================================
-- HVP 화면 확인용 간이 계정.
-- 흐름:
--   1) hvp 테이블에 행 추가(없으면) — UNIQUE(email) 충돌 시 갱신
--   2) 이미 로그인한 적 있어 profiles 에 행이 있으면 role=hvp 로 승격 + hvp_id 연결
--   3) 처음 로그인하면 0023의 handle_new_user 트리거가 자동 매칭(LOWER(email) 비교)

-- ── 1. hvp 행 ───────────────────────────────────────────────
INSERT INTO hvp (email, name, cohort, status, default_fee_rate)
VALUES ('yoona.heo04@gmail.com', '허유나', '테스트', 'active', 0.200)
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name,
      status = 'active';

-- ── 2. 이미 가입된 profile 이 있으면 hvp 로 승격 ─────────────
UPDATE profiles
SET role   = 'hvp'::app_role,
    hvp_id = (SELECT id FROM hvp WHERE LOWER(email) = 'yoona.heo04@gmail.com' LIMIT 1)
WHERE LOWER(email) = 'yoona.heo04@gmail.com';
