-- ============================================================
-- HEIM ERP — AI 직원
-- ============================================================
-- 작성: 2026-10-08
-- 목적: 클라우드 루틴(AI 직원)이 /api/ai-staff/* 로 ERP 를 점검·보고·수정.
--   ai_staff_posts    — AI 가 올리는 알림·주간 보고 (대시보드 'AI 직원' 페이지)
--   ai_staff_changes  — AI 가 직접 수정한 내역 (수정 전/후 · 되돌리기)
--   ai_staff_requests — 사람이 AI 에게 맡기는 개선 요청함
-- AI 는 service role 로 API 서버에서만 접근. 화면은 admin 만.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_staff_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL DEFAULT 'alert',      -- alert / report
  severity    TEXT NOT NULL DEFAULT 'info',       -- info / warn / urgent
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  company_id  BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  dedupe_key  TEXT,                               -- 같은 문제 중복 알림 방지용 (예: overdue:123)
  status      TEXT NOT NULL DEFAULT 'open',       -- open / done / dismissed
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_staff_posts_status ON public.ai_staff_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_staff_posts_dedupe ON public.ai_staff_posts(dedupe_key) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS public.ai_staff_changes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,                      -- set_next_action / set_last_contact / add_note / add_tapping_event / add_todo
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  company_id  BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  before      JSONB,
  after       JSONB,
  reason      TEXT NOT NULL DEFAULT '',           -- 왜 바꿨는지 (근거 출처 포함)
  source      TEXT NOT NULL DEFAULT '',           -- 어느 루틴 (daily / weekly / voice / ...)
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_staff_changes_created ON public.ai_staff_changes(created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_staff_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body         TEXT NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'open',      -- open / in_progress / done / rejected
  ai_reply     TEXT,
  pr_url       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: admin 만 (AI 는 service role 로 우회)
ALTER TABLE public.ai_staff_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_staff_changes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_staff_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_staff_posts_admin_all ON public.ai_staff_posts;
CREATE POLICY ai_staff_posts_admin_all ON public.ai_staff_posts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS ai_staff_changes_admin_all ON public.ai_staff_changes;
CREATE POLICY ai_staff_changes_admin_all ON public.ai_staff_changes
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS ai_staff_requests_admin_all ON public.ai_staff_requests;
CREATE POLICY ai_staff_requests_admin_all ON public.ai_staff_requests
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
