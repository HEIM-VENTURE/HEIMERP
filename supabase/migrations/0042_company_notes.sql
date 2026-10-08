-- ============================================================
-- HEIM ERP — 기업 담당자 노트 (타임라인)
-- ============================================================
-- 작성: 2026-10-08
-- 목적: 기업마다 한 줄 메모가 시간순으로 쌓이는 타임라인.
--       "이 기업 지금까지 뭐 했지?" 한 눈에 보기 + 팀원끼리 공유.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),  -- 작성자 (NULL = 계정 삭제됨)
  body TEXT NOT NULL,                             -- 노트 본문 (한 줄~여러 줄)
  pinned BOOLEAN DEFAULT false,                   -- 상단 고정 여부
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_notes_company_created
  ON public.company_notes(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.company_notes_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_company_notes_touch ON public.company_notes;
CREATE TRIGGER trg_company_notes_touch
  BEFORE UPDATE ON public.company_notes
  FOR EACH ROW EXECUTE FUNCTION public.company_notes_touch();

-- 노트가 쓰이면 자동으로 companies.last_contact_at = 오늘 로 갱신
-- (노트 쓴다는 건 뭔가 접촉이 있었다는 뜻)
CREATE OR REPLACE FUNCTION public.company_notes_touch_contact()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.companies
      SET last_contact_at = CURRENT_DATE
      WHERE id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_company_notes_touch_contact ON public.company_notes;
CREATE TRIGGER trg_company_notes_touch_contact
  AFTER INSERT ON public.company_notes
  FOR EACH ROW EXECUTE FUNCTION public.company_notes_touch_contact();

-- RLS: admin 전원 CRUD
ALTER TABLE public.company_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_notes_admin_all ON public.company_notes;
CREATE POLICY company_notes_admin_all ON public.company_notes
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
