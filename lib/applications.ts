/**
 * applications 테이블 조회 헬퍼 (server-side).
 *
 * 관리자 화면(/admin/applications) 목록·상세에서 사용.
 * 판정 저장은 별도 server action (app/admin/applications/[id]/actions.ts).
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Application, ApplicationStatus } from "@/lib/mock-applications";

// DB row → 화면용 Application 타입으로 매핑
// (mock-applications.ts의 Application 타입을 그대로 재사용해 UI 컴포넌트는 그대로)
type DbRow = {
  id: string;
  application_no: string;
  received_at: string;
  status: ApplicationStatus;
  company_name: string;
  business_number: string | null;
  ceo_name: string;
  headcount: number;
  website: string | null;
  tagline: string;
  contact_name: string;
  contact_role: string | null;
  email: string;
  phone: string;
  growth_stage: string;
  revenue_range: string;
  growth_trend: string;
  priorities: string[];
  goals: string;
  channel: string | null;
  files: {
    ir_deck?: FileMetaRow | null;
    business_cert?: FileMetaRow | null;
    company_intro?: FileMetaRow | null;
  } | null;
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_deadline: string | null;
  review_notes: string | null;
  ai_summary: Application["ai_summary"] | null;
  decided_at: string | null;
  archived_at: string | null;
};

type FileMetaRow = {
  name: string;
  path: string;
  size_bytes: number;
  mime: string;
};

/**
 * 활성 신청 목록 (archived 제외).
 */
export async function listApplications(): Promise<Application[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .is("archived_at", null)
    .order("received_at", { ascending: false });

  if (error) {
    console.error("[applications.list] 조회 실패", error);
    return [];
  }
  return (data ?? []).map(rowToApplication);
}

/**
 * 단건 조회 (archived 여부 무관 — 상세 진입 시엔 archived도 열람 가능).
 * 첨부 파일에 signed URL 부착.
 */
export async function getApplication(id: string): Promise<Application | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[applications.get] 조회 실패", error);
    return null;
  }

  const app = rowToApplication(data as DbRow);
  await attachSignedUrls(app, data as DbRow);
  return app;
}

// ─────────────────────────────────────────────
// DB row → 화면 타입 매핑
// ─────────────────────────────────────────────
function rowToApplication(row: DbRow): Application {
  return {
    id: row.id,
    application_no: row.application_no,
    received_at: row.received_at,
    status: row.status,
    company_name: row.company_name,
    business_number: row.business_number,
    ceo_name: row.ceo_name,
    headcount: row.headcount,
    website: row.website,
    tagline: row.tagline,
    contact_name: row.contact_name,
    contact_role: row.contact_role,
    email: row.email,
    phone: row.phone,
    growth_stage: row.growth_stage,
    revenue_range: row.revenue_range,
    growth_trend: row.growth_trend,
    priorities: row.priorities ?? [],
    goals: row.goals,
    channel: row.channel,
    files: {
      ir_deck: fileMetaToRow(row.files?.ir_deck),
      business_cert: fileMetaToRow(row.files?.business_cert),
      company_intro: fileMetaToRow(row.files?.company_intro),
    },
    reviewer: row.reviewer_name ?? null,
    review_deadline: row.review_deadline,
    ai_summary: row.ai_summary,
    review_notes: row.review_notes,
    decided_at: row.decided_at,
  };
}

function fileMetaToRow(
  meta: FileMetaRow | null | undefined
): { name: string; url: string; size_mb: number } | null {
  if (!meta) return null;
  return {
    name: meta.name,
    url: "#pending-signed-url",   // getApplication()에서 실제 URL로 대체됨
    size_mb: (meta.size_bytes ?? 0) / 1024 / 1024,
  };
}

// ─────────────────────────────────────────────
// Signed URL 부착 (상세 페이지 전용)
// ─────────────────────────────────────────────
const FILE_KINDS = ["ir_deck", "business_cert", "company_intro"] as const;
type FileKind = (typeof FILE_KINDS)[number];

async function attachSignedUrls(app: Application, row: DbRow): Promise<void> {
  // Storage 접근은 service_role로 (private bucket).
  const admin = createAdminClient();
  const bucket = "company-files";
  const rowFiles = row.files ?? {};
  for (const kind of FILE_KINDS) {
    const meta: FileMetaRow | null | undefined = rowFiles[kind as FileKind];
    const uiFile = app.files[kind];
    if (!meta?.path || !uiFile) continue;
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(meta.path, 60 * 60); // 1시간 유효
    if (error || !data?.signedUrl) {
      console.warn(`[applications.signedUrl] 실패 ${kind}`, error);
      continue;
    }
    uiFile.url = data.signedUrl;
  }
}
