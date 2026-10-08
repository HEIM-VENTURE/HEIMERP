-- ============================================================
-- HEIM ERP — 인사관리: 멤버·연차
-- ============================================================
-- 작성: 2026-10-08
-- 목적: 팀 멤버 입사일/연간 연차수 관리 + 연차 신청·승인·잔여 집계
-- ============================================================

-- profiles 에 입사일, 연간 기본 연차 수 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hired_at DATE,
  ADD COLUMN IF NOT EXISTS annual_leave_days NUMERIC DEFAULT 15,
  ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active';
  -- employment_status: active / on_leave / resigned

-- 연차 신청
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'annual',
    -- annual (연차) / half_am (오전반차) / half_pm (오후반차) /
    -- sick (병가) / official (공가) / other
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC NOT NULL,                    -- 사용일수 (반차 0.5)
  reason TEXT,                              -- 사유 (선택)
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending (대기) / approved (승인) / rejected (반려) / cancelled (취소)
  decided_by UUID REFERENCES public.profiles(id),
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.leave_requests_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_leave_requests_touch ON public.leave_requests;
CREATE TRIGGER trg_leave_requests_touch
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.leave_requests_touch();

-- RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 본인 신청 생성·조회·취소
DROP POLICY IF EXISTS leave_requests_own_rw ON public.leave_requests;
CREATE POLICY leave_requests_own_rw ON public.leave_requests
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admin 은 전부 조회·승인·반려
DROP POLICY IF EXISTS leave_requests_admin_all ON public.leave_requests;
CREATE POLICY leave_requests_admin_all ON public.leave_requests
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
