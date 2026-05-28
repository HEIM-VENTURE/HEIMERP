-- ============================================================
-- HEIM ERP — HVP 온보딩 단계 (신청 → 결제 → 교육이수 → 파트너)
-- ============================================================
-- HVP는 유료 교육(기본 150만원) 결제 후 교육을 이수하고 파트너로 활동.
-- 그래서 신청서에 온보딩 단계 + 결제 정보를 추가한다.
--
-- onboarding_stage 값:
--   applied   = 신청 (기본)
--   paid      = 결제 완료
--   completed = 교육 이수
--   partner   = 파트너 활동 (HVP 명단 등록 완료)
--   rejected  = 거절/중도이탈

ALTER TABLE hvp_applications
  ADD COLUMN IF NOT EXISTS onboarding_stage TEXT NOT NULL DEFAULT 'applied',
  ADD COLUMN IF NOT EXISTS paid_amount      NUMERIC,   -- 단위: 만원 (예: 150)
  ADD COLUMN IF NOT EXISTS paid_at          DATE,
  ADD COLUMN IF NOT EXISTS completed_at     DATE;       -- 교육 이수일

-- 기존 status 값을 온보딩 단계로 백필
UPDATE hvp_applications SET onboarding_stage =
  CASE status
    WHEN 'approved' THEN 'partner'
    WHEN 'rejected' THEN 'rejected'
    ELSE 'applied'
  END
WHERE onboarding_stage = 'applied';
