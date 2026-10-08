import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AI_ACTION_TYPES, checkAiStaffAuth, todayKst } from "@/lib/ai-staff";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/ai-staff/snapshot
 * AI 직원이 점검·보고에 쓰는 ERP 현황 한 묶음 (읽기 전용).
 * 인증: Authorization: Bearer <AI_STAFF_TOKEN>
 */
export async function GET(req: Request) {
  const auth = checkAiStaffAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = createAdminClient();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since60 = new Date(Date.now() - 60 * 86400000).toISOString();
  const since14 = new Date(Date.now() - 14 * 86400000).toISOString();

  const [companies, tappings, events, notes, todos, applications, posts, changes, requests, admins, lastReport, paidRows] =
    await Promise.all([
      db
        .from("companies")
        .select(
          "id, name, ceo_name, submitter_name, custom_fields, sales_stage, consulting_stage, growth_stage, growth_stage_note, next_action, next_action_due, last_contact_at, drive_folder_url, received_at, contracted_at, started_at",
        )
        .is("drop_reason", null)
        .order("id"),
      db
        .from("investor_tappings")
        .select("id, company_id, company_name_snapshot, lips_eligible, tips_eligible, personal_fund_eligible, progress_status, confirmed_operator"),
      db.from("tapping_events").select("tapping_id, sequence, operator, status, contact_date").order("sequence"),
      db
        .from("company_notes")
        .select("company_id, body, author_id, created_at")
        .gte("created_at", since30)
        .order("created_at", { ascending: false })
        .limit(300),
      db
        .from("todos")
        .select("id, company_id, title, due_date, status, category, auto_generated, assignee_id")
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(300),
      db
        .from("applications")
        .select("id, application_no, company_name, status, received_at, archived_at")
        .gte("received_at", since60)
        .order("received_at", { ascending: false }),
      db
        .from("ai_staff_posts")
        .select("id, kind, severity, title, company_id, dedupe_key, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      db
        .from("ai_staff_changes")
        .select("action, company_id, after, reason, source, reverted_at, created_at")
        .gte("created_at", since14)
        .order("created_at", { ascending: false })
        .limit(200),
      db
        .from("ai_staff_requests")
        .select("id, body, status, ai_reply, pr_url, created_at")
        .in("status", ["open", "in_progress"])
        .order("created_at"),
      db.from("profiles").select("id, name").eq("role", "admin"),
      db
        .from("ai_staff_posts")
        .select("title, body, created_at")
        .eq("kind", "report")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.from("paid_customers").select("company_id, company_name, legal_name").not("company_id", "is", null),
    ]);

  const firstError = [companies, tappings, events, notes, todos, applications, posts, changes, requests, admins, lastReport, paidRows].find(
    (r) => r.error,
  );
  if (firstError?.error) return NextResponse.json({ error: firstError.error.message }, { status: 500 });

  const adminName = new Map((admins.data ?? []).map((p) => [p.id as string, p.name as string]));

  const eventsByTapping = new Map<string, unknown[]>();
  for (const e of events.data ?? []) {
    const arr = eventsByTapping.get(e.tapping_id) ?? [];
    arr.push({ sequence: e.sequence, operator: e.operator, status: e.status, contact_date: e.contact_date });
    eventsByTapping.set(e.tapping_id, arr);
  }

  return NextResponse.json({
    today_kst: todayKst(),
    actions_available: AI_ACTION_TYPES,
    admins: (admins.data ?? []).map((p) => p.name),
    companies: (companies.data ?? []).map((c) => {
      const { custom_fields, drive_folder_url, ...rest } = c as Record<string, unknown> & {
        custom_fields: { pm?: string } | null;
        drive_folder_url: string | null;
      };
      return { ...rest, pm: custom_fields?.pm ?? null, has_drive_folder: !!drive_folder_url };
    }),
    tappings: (tappings.data ?? []).map((t) => ({ ...t, events: eventsByTapping.get(t.id) ?? [] })),
    recent_notes_30d: (notes.data ?? []).map((n) => ({
      company_id: n.company_id,
      by: n.author_id ? adminName.get(n.author_id) ?? "기타" : "AI/시스템",
      body: String(n.body).slice(0, 500),
      created_at: n.created_at,
    })),
    open_todos: (todos.data ?? []).map((t) => ({
      ...t,
      assignee: t.assignee_id ? adminName.get(t.assignee_id) ?? null : null,
      assignee_id: undefined,
    })),
    applications_60d: applications.data ?? [],
    my_open_posts: posts.data ?? [],
    my_recent_changes_14d: changes.data ?? [],
    open_requests: requests.data ?? [],
    last_weekly_report: lastReport.data ?? null,
    // 고객 현황표의 식별이름(company_name)·법인등기명(legal_name) — 대표자 이름으로 등록된 중복 찾기용
    paid_customer_names: paidRows.data ?? [],
  });
}
