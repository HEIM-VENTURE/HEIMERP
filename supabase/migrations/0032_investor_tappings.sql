-- ============================================================
-- HEIM ERP — 투자 딜 심사역 태핑 표
-- ============================================================
-- 작성: 2026-09-17
-- 목적: 사용자 제공 xlsx (프로젝트 관리.xlsx) 기반. 기업별 태핑 진행 관리.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.investor_tappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq INT,                                  -- 순번 (xlsx 원본)
  company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name_snapshot TEXT NOT NULL,      -- xlsx 원본 이름 (매칭 안 될 때도 표시)
  prev_revenue TEXT,                        -- 직전매출 원문 ('9.5', '-', '?' 등 자유 형식)
  headcount TEXT,                           -- 직원 수 원문 ('5', '?', '-', '설립전' 등)
  established_at TEXT,                      -- 설립일 원문 ('2025.03.11.', '(예비창업자)' 등)
  personal_fund_eligible TEXT,              -- 개투조합 여/부/대기중
  lips_eligible TEXT,                       -- LIPS 여/부/대기중
  tips_eligible TEXT,                       -- TIPS 여/부/대기중
  progress_status TEXT,                     -- 진행여부
  confirmed_operator TEXT,                  -- 확정 운영사
  tapping_1 TEXT,
  tapping_2 TEXT,
  tapping_3 TEXT,
  tapping_4 TEXT,
  tapping_5 TEXT,
  notes TEXT,                               -- 자유 메모
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investor_tappings_company_id
  ON public.investor_tappings(company_id);
CREATE INDEX IF NOT EXISTS idx_investor_tappings_seq
  ON public.investor_tappings(seq);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.investor_tappings_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_investor_tappings_touch ON public.investor_tappings;
CREATE TRIGGER trg_investor_tappings_touch
  BEFORE UPDATE ON public.investor_tappings
  FOR EACH ROW EXECUTE FUNCTION public.investor_tappings_touch_updated_at();

-- RLS: admin 전용
ALTER TABLE public.investor_tappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS investor_tappings_admin_all ON public.investor_tappings;
CREATE POLICY investor_tappings_admin_all ON public.investor_tappings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
