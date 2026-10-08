import { timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * AI 직원 (클라우드 루틴) 공용 로직.
 * - API 인증: Authorization: Bearer <AI_STAFF_TOKEN>
 * - 허용된 동작만 실행 (화이트리스트) · 삭제 동작 없음
 * - 데이터 수정은 전부 ai_staff_changes 에 수정 전/후 기록 → 화면에서 되돌리기
 */

export function checkAiStaffAuth(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.AI_STAFF_TOKEN;
  if (!expected) return { ok: false, status: 503, error: "AI_STAFF_TOKEN 미설정" };
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  return { ok: true };
}

/** KST 기준 오늘 (YYYY-MM-DD) */
export function todayKst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// ---------- 입력 검증 ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function str(v: unknown, field: string, max: number, required = true): string | null {
  if (v === undefined || v === null || v === "") {
    if (required) throw new Error(`${field} 필요`);
    return null;
  }
  if (typeof v !== "string") throw new Error(`${field} 는 문자열이어야 함`);
  const t = v.trim();
  if (required && !t) throw new Error(`${field} 필요`);
  if (t.length > max) throw new Error(`${field} 는 ${max}자 이하`);
  return t || null;
}

function date(v: unknown, field: string, required = false): string | null {
  if (v === undefined || v === null || v === "") {
    if (required) throw new Error(`${field} 필요`);
    return null;
  }
  if (typeof v !== "string" || !DATE_RE.test(v)) throw new Error(`${field} 는 YYYY-MM-DD`);
  return v;
}

function companyId(v: unknown): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Error("company_id 는 양의 정수");
  return n;
}

function oneOf<T extends string>(v: unknown, field: string, allowed: readonly T[], fallback: T): T {
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof v !== "string" || !allowed.includes(v as T)) {
    throw new Error(`${field} 는 ${allowed.join("/")} 중 하나`);
  }
  return v as T;
}

const TAPPING_STATUSES = ["contacted", "meeting", "reviewing", "interested", "committed", "passed", "hold"] as const;

// ---------- 동작 실행 ----------

export type AiAction = { type: string; [k: string]: unknown };
export type AiActionResult = { type: string; ok: boolean; skipped?: boolean; id?: string; error?: string };

type Ctx = { db: SupabaseClient; source: string };

async function logChange(
  ctx: Ctx,
  row: {
    action: string;
    table_name: string;
    record_id: string;
    company_id: number | null;
    before: unknown;
    after: unknown;
    reason: string;
  },
) {
  const { error } = await ctx.db.from("ai_staff_changes").insert({ ...row, source: ctx.source });
  if (error) throw new Error("변경 기록 실패: " + error.message);
}

async function loadCompany(ctx: Ctx, id: number) {
  const { data, error } = await ctx.db
    .from("companies")
    .select("id, name, next_action, next_action_due, last_contact_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`company_id ${id} 없음`);
  return data as {
    id: number;
    name: string;
    next_action: string | null;
    next_action_due: string | null;
    last_contact_at: string | null;
  };
}

const handlers: Record<string, (ctx: Ctx, a: AiAction) => Promise<AiActionResult>> = {
  /** 알림·보고 게시 (dedupe_key 가 같은 열린 알림이 있으면 건너뜀) */
  async post(ctx, a) {
    const kind = oneOf(a.kind, "kind", ["alert", "report"] as const, "alert");
    const severity = oneOf(a.severity, "severity", ["info", "warn", "urgent"] as const, "info");
    const title = str(a.title, "title", 200)!;
    const body = str(a.body, "body", 20000, false) ?? "";
    const cid = a.company_id ? companyId(a.company_id) : null;
    const dedupe = str(a.dedupe_key, "dedupe_key", 200, false);
    if (dedupe) {
      const { data: dup } = await ctx.db
        .from("ai_staff_posts")
        .select("id")
        .eq("dedupe_key", dedupe)
        .eq("status", "open")
        .limit(1);
      if (dup && dup.length > 0) return { type: "post", ok: true, skipped: true, id: dup[0].id };
    }
    const { data, error } = await ctx.db
      .from("ai_staff_posts")
      .insert({ kind, severity, title, body, company_id: cid, dedupe_key: dedupe })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { type: "post", ok: true, id: data.id };
  },

  /** 해결된 알림 닫기 (AI 가 다음 점검에서 문제가 사라진 걸 확인했을 때) */
  async resolve_post(ctx, a) {
    const id = str(a.id, "id", 64)!;
    const { error } = await ctx.db
      .from("ai_staff_posts")
      .update({ status: "done", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "open");
    if (error) throw new Error(error.message);
    return { type: "resolve_post", ok: true, id };
  },

  async set_next_action(ctx, a) {
    const cid = companyId(a.company_id);
    const reason = str(a.reason, "reason", 1000)!;
    const next_action = str(a.next_action, "next_action", 500, false);
    const next_action_due = date(a.next_action_due, "next_action_due");
    const c = await loadCompany(ctx, cid);
    const { error } = await ctx.db.from("companies").update({ next_action, next_action_due }).eq("id", cid);
    if (error) throw new Error(error.message);
    await logChange(ctx, {
      action: "set_next_action",
      table_name: "companies",
      record_id: String(cid),
      company_id: cid,
      before: { next_action: c.next_action, next_action_due: c.next_action_due },
      after: { next_action, next_action_due },
      reason,
    });
    return { type: "set_next_action", ok: true, id: String(cid) };
  },

  async set_last_contact(ctx, a) {
    const cid = companyId(a.company_id);
    const reason = str(a.reason, "reason", 1000)!;
    const last_contact_at = date(a.date, "date", true);
    const c = await loadCompany(ctx, cid);
    // 더 오래된 날짜로 되돌리는 건 막음
    if (c.last_contact_at && last_contact_at! <= c.last_contact_at) {
      return { type: "set_last_contact", ok: true, skipped: true, id: String(cid) };
    }
    const { error } = await ctx.db.from("companies").update({ last_contact_at }).eq("id", cid);
    if (error) throw new Error(error.message);
    await logChange(ctx, {
      action: "set_last_contact",
      table_name: "companies",
      record_id: String(cid),
      company_id: cid,
      before: { last_contact_at: c.last_contact_at },
      after: { last_contact_at },
      reason,
    });
    return { type: "set_last_contact", ok: true, id: String(cid) };
  },

  /** 기업 타임라인 메모 추가 (트리거가 last_contact_at 을 오늘로 갱신함) */
  async add_note(ctx, a) {
    const cid = companyId(a.company_id);
    const reason = str(a.reason, "reason", 1000)!;
    const body = str(a.body, "body", 4000)!;
    const c = await loadCompany(ctx, cid);
    const { data, error } = await ctx.db
      .from("company_notes")
      .insert({ company_id: cid, body: `🤖 ${body}`, author_id: null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const after = await loadCompany(ctx, cid);
    await logChange(ctx, {
      action: "add_note",
      table_name: "company_notes",
      record_id: data.id,
      company_id: cid,
      before: { last_contact_at: c.last_contact_at },
      after: { body, last_contact_at: after.last_contact_at },
      reason,
    });
    return { type: "add_note", ok: true, id: data.id };
  },

  async add_tapping_event(ctx, a) {
    const cid = companyId(a.company_id);
    const reason = str(a.reason, "reason", 1000)!;
    const operator = str(a.operator, "operator", 200)!;
    const status = oneOf(a.status, "status", TAPPING_STATUSES, "contacted");
    const contact_date = date(a.contact_date, "contact_date");
    const notes = str(a.notes, "notes", 2000, false);
    const c = await loadCompany(ctx, cid);

    let createdTappingId: string | null = null;
    const { data: tap } = await ctx.db
      .from("investor_tappings")
      .select("id")
      .eq("company_id", cid)
      .limit(1)
      .maybeSingle();
    let tappingId = tap?.id as string | undefined;
    if (!tappingId) {
      const { data: created, error } = await ctx.db
        .from("investor_tappings")
        .insert({ company_id: cid, company_name_snapshot: c.name })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      tappingId = created.id as string;
      createdTappingId = tappingId;
    }

    const { data: last } = await ctx.db
      .from("tapping_events")
      .select("sequence")
      .eq("tapping_id", tappingId)
      .order("sequence", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sequence = ((last?.sequence as number | null) ?? 0) + 1;

    const { data, error } = await ctx.db
      .from("tapping_events")
      .insert({ tapping_id: tappingId, sequence, operator, status, contact_date, notes })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logChange(ctx, {
      action: "add_tapping_event",
      table_name: "tapping_events",
      record_id: data.id,
      company_id: cid,
      before: null,
      after: { operator, status, contact_date, notes, created_tapping_id: createdTappingId },
      reason,
    });
    return { type: "add_tapping_event", ok: true, id: data.id };
  },

  async add_todo(ctx, a) {
    const cid = a.company_id ? companyId(a.company_id) : null;
    const reason = str(a.reason, "reason", 1000)!;
    const title = str(a.title, "title", 300)!;
    const description = str(a.description, "description", 2000, false);
    const due_date = date(a.due_date, "due_date");
    const assigneeName = str(a.assignee_name, "assignee_name", 50, false);
    let assignee_id: string | null = null;
    if (assigneeName) {
      const { data: p } = await ctx.db
        .from("profiles")
        .select("id")
        .eq("name", assigneeName)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      assignee_id = (p?.id as string | undefined) ?? null;
    }
    const { data, error } = await ctx.db
      .from("todos")
      .insert({
        company_id: cid,
        title,
        description: description ? `🤖 ${description}` : "🤖 AI 직원이 등록",
        due_date,
        assignee_id,
        auto_generated: true,
        category: cid ? "deal" : "general",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logChange(ctx, {
      action: "add_todo",
      table_name: "todos",
      record_id: String(data.id),
      company_id: cid,
      before: null,
      after: { title, due_date, assignee_name: assigneeName, assignee_found: !!assignee_id },
      reason,
    });
    return { type: "add_todo", ok: true, id: String(data.id) };
  },

  /** 개선 요청 상태·답변 갱신 (시스템 관리 루틴용) */
  async update_request(ctx, a) {
    const id = str(a.id, "id", 64)!;
    const status = oneOf(a.status, "status", ["open", "in_progress", "done", "rejected"] as const, "in_progress");
    const ai_reply = str(a.ai_reply, "ai_reply", 4000, false);
    const pr_url = str(a.pr_url, "pr_url", 500, false);
    if (pr_url && !pr_url.startsWith("https://github.com/")) throw new Error("pr_url 은 GitHub 주소만");
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (ai_reply !== null) patch.ai_reply = ai_reply;
    if (pr_url !== null) patch.pr_url = pr_url;
    const { error } = await ctx.db.from("ai_staff_requests").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { type: "update_request", ok: true, id };
  },
};

export const AI_ACTION_TYPES = Object.keys(handlers);

export async function runAiActions(db: SupabaseClient, source: string, actions: AiAction[]) {
  const ctx: Ctx = { db, source };
  const results: AiActionResult[] = [];
  for (const a of actions) {
    const handler = handlers[a?.type];
    if (!handler) {
      results.push({ type: String(a?.type), ok: false, error: `허용되지 않은 동작. 가능: ${AI_ACTION_TYPES.join(", ")}` });
      continue;
    }
    try {
      results.push(await handler(ctx, a));
    } catch (e) {
      results.push({ type: a.type, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return results;
}

// ---------- 되돌리기 (화면에서 admin 이 실행) ----------

type ChangeRow = {
  id: string;
  action: string;
  record_id: string;
  company_id: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reverted_at: string | null;
};

/**
 * AI 변경 1건 되돌리기. 그 사이 사람이 같은 값을 다시 바꿨으면 덮어쓰지 않고 거절.
 * db 는 service role 클라이언트 (호출 전에 admin 확인 필수).
 */
export async function revertAiChange(db: SupabaseClient, changeId: string, adminId: string): Promise<{ error?: string }> {
  const { data, error } = await db.from("ai_staff_changes").select("*").eq("id", changeId).maybeSingle();
  if (error) return { error: error.message };
  const ch = data as ChangeRow | null;
  if (!ch) return { error: "기록을 찾을 수 없습니다." };
  if (ch.reverted_at) return { error: "이미 되돌린 변경입니다." };
  const before = ch.before ?? {};
  const after = ch.after ?? {};

  const companyFieldsUnchanged = async (fields: string[]) => {
    const { data: c } = await db.from("companies").select(fields.join(", ")).eq("id", ch.company_id).maybeSingle();
    if (!c) return false;
    const row = c as unknown as Record<string, unknown>;
    return fields.every((f) => (row[f] ?? null) === (after[f] ?? null));
  };

  switch (ch.action) {
    case "set_next_action": {
      if (!(await companyFieldsUnchanged(["next_action", "next_action_due"]))) {
        return { error: "그 뒤에 다음 액션이 다시 바뀌어서 되돌리지 않았습니다." };
      }
      const { error: e } = await db
        .from("companies")
        .update({ next_action: before.next_action ?? null, next_action_due: before.next_action_due ?? null })
        .eq("id", ch.company_id);
      if (e) return { error: e.message };
      break;
    }
    case "set_last_contact": {
      if (!(await companyFieldsUnchanged(["last_contact_at"]))) {
        return { error: "그 뒤에 마지막 접촉일이 다시 바뀌어서 되돌리지 않았습니다." };
      }
      const { error: e } = await db
        .from("companies")
        .update({ last_contact_at: before.last_contact_at ?? null })
        .eq("id", ch.company_id);
      if (e) return { error: e.message };
      break;
    }
    case "add_note": {
      const { error: e } = await db.from("company_notes").delete().eq("id", ch.record_id);
      if (e) return { error: e.message };
      // 메모 때문에 바뀐 마지막 접촉일도 원래대로 (그 뒤 안 바뀐 경우만)
      if (await companyFieldsUnchanged(["last_contact_at"])) {
        await db.from("companies").update({ last_contact_at: before.last_contact_at ?? null }).eq("id", ch.company_id);
      }
      break;
    }
    case "add_tapping_event": {
      const { error: e } = await db.from("tapping_events").delete().eq("id", ch.record_id);
      if (e) return { error: e.message };
      const createdTapping = after.created_tapping_id as string | null | undefined;
      if (createdTapping) {
        const { count } = await db
          .from("tapping_events")
          .select("id", { count: "exact", head: true })
          .eq("tapping_id", createdTapping);
        if (!count) await db.from("investor_tappings").delete().eq("id", createdTapping);
      }
      break;
    }
    case "add_todo": {
      const { error: e } = await db.from("todos").delete().eq("id", Number(ch.record_id));
      if (e) return { error: e.message };
      break;
    }
    default:
      return { error: `되돌릴 수 없는 동작: ${ch.action}` };
  }

  const { error: markErr } = await db
    .from("ai_staff_changes")
    .update({ reverted_at: new Date().toISOString(), reverted_by: adminId })
    .eq("id", ch.id);
  if (markErr) return { error: markErr.message };
  return {};
}
