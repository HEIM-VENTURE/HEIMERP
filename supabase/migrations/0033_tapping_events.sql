-- ============================================================
-- HEIM ERP — 태핑 이벤트 로그 (2단계 전환)
-- ============================================================
-- 작성: 2026-09-17
-- 목적: investor_tappings.tapping_1~5 컬럼 (최대 5개, 단순 텍스트) →
--       별도 이벤트 테이블로 분리. 무한 태핑 이력 + 상태·날짜·메모 관리.
-- 이관: 기존 5개 컬럼 값을 events 로 옮기는 것은 별도 Python 스크립트.
--       기존 컬럼은 nullable 로 남겨두되 UI 에서 안 씀 (다음 정리 라운드에 drop).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tapping_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tapping_id UUID NOT NULL REFERENCES public.investor_tappings(id) ON DELETE CASCADE,
  sequence INT NOT NULL,                    -- 몇 번째 태핑인지 (1부터, 자동 계산)
  operator TEXT NOT NULL,                   -- 태핑 대상 (코맥스벤처러스 등)
  status TEXT NOT NULL DEFAULT 'contacted', -- contacted/meeting/reviewing/interested/passed/committed/hold
  contact_date DATE,                        -- 연락한 날짜
  notes TEXT,                               -- 자유 메모
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tapping_events_tapping_id
  ON public.tapping_events(tapping_id);
CREATE INDEX IF NOT EXISTS idx_tapping_events_tapping_seq
  ON public.tapping_events(tapping_id, sequence);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.tapping_events_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tapping_events_touch ON public.tapping_events;
CREATE TRIGGER trg_tapping_events_touch
  BEFORE UPDATE ON public.tapping_events
  FOR EACH ROW EXECUTE FUNCTION public.tapping_events_touch_updated_at();

-- 부모(investor_tappings)의 updated_at 도 이벤트 변경 시 갱신 (최근 수정순 정렬용)
CREATE OR REPLACE FUNCTION public.tapping_events_touch_parent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.tapping_id;
  ELSE
    target_id := NEW.tapping_id;
  END IF;
  UPDATE public.investor_tappings
    SET updated_at = now()
    WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_tapping_events_touch_parent ON public.tapping_events;
CREATE TRIGGER trg_tapping_events_touch_parent
  AFTER INSERT OR UPDATE OR DELETE ON public.tapping_events
  FOR EACH ROW EXECUTE FUNCTION public.tapping_events_touch_parent();

-- RLS: admin 전용
ALTER TABLE public.tapping_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tapping_events_admin_all ON public.tapping_events;
CREATE POLICY tapping_events_admin_all ON public.tapping_events
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
