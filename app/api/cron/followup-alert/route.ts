import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { postSlackMessage, type SlackBlock } from "@/lib/slack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 매 평일 09:00 KST (= 00:00 UTC) 실행.
 * 방치 기업 + 다음 액션 마감 임박/지남 집계 후 Slack 포스팅.
 *
 * Vercel Cron 호출. 수동 호출도 가능하지만 그 땐 CRON_SECRET 쿼리 필요.
 *
 * 환경변수:
 *   - SLACK_BOT_TOKEN
 *   - SLACK_FOLLOWUP_CHANNEL (예: "#a2-works-management" 또는 "C01234...")
 *   - CRON_SECRET (수동 호출 보호용, 선택)
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (RLS 우회 조회)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  // Vercel Cron 은 자동으로 'x-vercel-cron: 1' 헤더 보냄.
  // 수동 호출은 ?secret=... 필요.
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  if (!isVercelCron) {
    const secret = url.searchParams.get("secret");
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const channel = process.env.SLACK_FOLLOWUP_CHANNEL ?? "#a2-works-management";

  // RLS 우회해서 전체 조회
  const supa = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: companies, error } = await supa
    .from("companies")
    .select("id, name, custom_fields, last_contact_at, next_action, next_action_due")
    .is("drop_reason", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const todayStr = new Date(now).toISOString().slice(0, 10);
  const daysSince = (iso: string | null) => (iso ? Math.floor((now - new Date(iso).getTime()) / 86400000) : null);
  const dueDiff = (iso: string | null) => (iso ? Math.floor((new Date(iso).getTime() - now) / 86400000) : null);

  type Row = {
    id: number;
    name: string;
    pm: string;
    last_contact_at: string | null;
    next_action: string | null;
    next_action_due: string | null;
    _days: number | null;
    _due: number | null;
  };
  const rows: Row[] = (companies ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    pm: (c.custom_fields as { pm?: string } | null)?.pm ?? "미지정",
    last_contact_at: c.last_contact_at,
    next_action: c.next_action,
    next_action_due: c.next_action_due,
    _days: daysSince(c.last_contact_at),
    _due: dueDiff(c.next_action_due),
  }));

  const stale30 = rows.filter((r) => (r._days ?? 999) >= 30 && (r._days ?? 999) < 365).sort((a, b) => (b._days ?? 0) - (a._days ?? 0));
  const stale14 = rows.filter((r) => (r._days ?? 0) >= 14 && (r._days ?? 0) < 30);
  const noContact = rows.filter((r) => r._days === null);
  const dueOverdue = rows.filter((r) => r._due !== null && r._due < 0).sort((a, b) => (a._due ?? 0) - (b._due ?? 0));
  const dueSoon = rows.filter((r) => r._due !== null && r._due >= 0 && r._due <= 3).sort((a, b) => (a._due ?? 0) - (b._due ?? 0));

  // 아무것도 없으면 조용히 넘어감
  if (stale30.length === 0 && dueOverdue.length === 0 && dueSoon.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: "nothing urgent" });
  }

  const baseUrl = "https://heim-erp.vercel.app";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📋 오늘 챙겨야 할 기업 · ${todayStr}`, emoji: true },
    },
  ];

  if (dueOverdue.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*⏰ 다음 액션 마감 지남 · ${dueOverdue.length}곳*` },
    });
    for (const r of dueOverdue.slice(0, 10)) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• <${baseUrl}/admin/companies/${r.id}|${r.name}> · ${-(r._due ?? 0)}일 지남 · _${r.pm}_\n> ${r.next_action ?? "—"}`,
        },
      });
    }
  }

  if (dueSoon.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*🔔 D-3 이내 마감 · ${dueSoon.length}곳*` },
    });
    for (const r of dueSoon.slice(0, 10)) {
      const label = r._due === 0 ? "오늘" : `D-${r._due}`;
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• <${baseUrl}/admin/companies/${r.id}|${r.name}> · ${label} · _${r.pm}_\n> ${r.next_action ?? "—"}`,
        },
      });
    }
  }

  if (stale30.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*🚨 방치 30일+ · ${stale30.length}곳*` },
    });
    const lines = stale30
      .slice(0, 15)
      .map((r) => `• <${baseUrl}/admin/companies/${r.id}|${r.name}> · ${r._days}일 · _${r.pm}_`)
      .join("\n");
    blocks.push({ type: "section", text: { type: "mrkdwn", text: lines } });
  }

  if (stale14.length > 0 || noContact.length > 0) {
    blocks.push({ type: "divider" });
    const parts: string[] = [];
    if (stale14.length > 0) parts.push(`14~30일 접촉 없음 ${stale14.length}곳`);
    if (noContact.length > 0) parts.push(`접촉 기록 없음 ${noContact.length}곳`);
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${parts.join(" · ")}  <${baseUrl}/admin/pipeline|전체 보기 →>`,
        },
      ],
    });
  }

  const summaryText = `${todayStr} 후속 관리 · 마감지남 ${dueOverdue.length} · D-3 ${dueSoon.length} · 방치30+ ${stale30.length}곳`;
  const slackRes = await postSlackMessage({ channel, text: summaryText, blocks });
  if (!slackRes.ok) {
    return NextResponse.json({ error: slackRes.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    posted: {
      due_overdue: dueOverdue.length,
      due_soon: dueSoon.length,
      stale_30: stale30.length,
      stale_14: stale14.length,
      no_contact: noContact.length,
    },
    slack_ts: slackRes.ts,
  });
}
