import Link from "next/link";
import { Bot, Bell, FileText, History, MessageSquarePlus, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RoleCards, RoleTag, AI_ROLES, type RoleKey, type RoleStat } from "./roles";
import { PostButtons, RevertButton, RequestForm, CancelRequestButton } from "./controls";

export const dynamic = "force-dynamic";

type Post = {
  id: string;
  kind: "alert" | "report";
  severity: "info" | "warn" | "urgent";
  title: string;
  body: string;
  company_id: number | null;
  status: string;
  created_at: string;
  companies: { name: string } | null;
};
type Change = {
  id: string;
  action: string;
  company_id: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string;
  source: string;
  reverted_at: string | null;
  created_at: string;
  companies: { name: string } | null;
};
type Req = {
  id: string;
  body: string;
  status: "open" | "in_progress" | "done" | "rejected";
  ai_reply: string | null;
  pr_url: string | null;
  created_at: string;
  profiles: { name: string } | null;
};

const SEVERITY_STYLE: Record<string, string> = {
  urgent: "border-rose-200 bg-rose-50/60",
  warn: "border-amber-200 bg-amber-50/50",
  info: "border-zinc-200 bg-white",
};
const SEVERITY_BADGE: Record<string, { label: string; cls: string }> = {
  urgent: { label: "긴급", cls: "bg-rose-100 text-rose-700" },
  warn: { label: "주의", cls: "bg-amber-100 text-amber-700" },
  info: { label: "참고", cls: "bg-zinc-100 text-zinc-600" },
};
const SEVERITY_ORDER: Record<string, number> = { urgent: 0, warn: 1, info: 2 };

const ACTION_LABEL: Record<string, string> = {
  set_next_action: "다음 액션 변경",
  set_last_contact: "마지막 접촉일 변경",
  add_note: "메모 추가",
  add_tapping_event: "태핑 기록 추가",
  add_todo: "할 일 등록",
  mark_duplicate: "중복 기업 정리",
};
const REQ_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "대기", cls: "bg-zinc-100 text-zinc-600" },
  in_progress: { label: "진행 중", cls: "bg-blue-100 text-blue-700" },
  done: { label: "완료", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "보류·취소", cls: "bg-stone-100 text-stone-600" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function describeChange(c: Change): string {
  const a = c.after ?? {};
  const b = c.before ?? {};
  switch (c.action) {
    case "set_next_action":
      return `"${b.next_action ?? "없음"}"${b.next_action_due ? ` (${b.next_action_due})` : ""} → "${a.next_action ?? "없음"}"${a.next_action_due ? ` (${a.next_action_due})` : ""}`;
    case "set_last_contact":
      return `${b.last_contact_at ?? "없음"} → ${a.last_contact_at}`;
    case "add_note":
      return String(a.body ?? "");
    case "add_tapping_event":
      return `${a.operator} · ${a.status}${a.contact_date ? ` · ${a.contact_date}` : ""}`;
    case "mark_duplicate":
      return `"${a.dup_name}" → "${a.keep_name}"와 같은 기업으로 보고 드랍 처리 (삭제 아님)`;
    case "add_todo":
      return `${a.title}${a.due_date ? ` (마감 ${a.due_date})` : ""}${a.assignee_name ? ` · ${a.assignee_name}` : ""}`;
    default:
      return "";
  }
}

export default async function AiStaffPage() {
  const supabase = await createClient();
  const weekAgo = daysAgoIso(7);

  const [alertsRes, reportsRes, changesRes, requestsRes, lastAlertRes] = await Promise.all([
    supabase
      .from("ai_staff_posts")
      .select("id, kind, severity, title, body, company_id, status, created_at, companies(name)")
      .eq("kind", "alert")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("ai_staff_posts")
      .select("id, kind, severity, title, body, company_id, status, created_at, companies(name)")
      .eq("kind", "report")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ai_staff_changes")
      .select("id, action, company_id, before, after, reason, source, reverted_at, created_at, companies(name)")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("ai_staff_requests")
      .select("id, body, status, ai_reply, pr_url, created_at, profiles:requested_by(name)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("ai_staff_posts")
      .select("created_at")
      .eq("kind", "alert")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (alertsRes.error) {
    return (
      <div className="max-w-3xl bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
        <div className="font-semibold mb-1">AI 직원 준비 중</div>
        <p>
          Supabase 에 <code className="font-mono">0049_ai_staff.sql</code> 마이그레이션을 실행하면 이 화면이 열립니다.
        </p>
        <p className="mt-2 text-[12px] text-amber-700">오류: {alertsRes.error.message}</p>
      </div>
    );
  }

  const alerts = ((alertsRes.data ?? []) as unknown as Post[]).sort(
    (x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity],
  );
  const reports = (reportsRes.data ?? []) as unknown as Post[];
  const changes = (changesRes.data ?? []) as unknown as Change[];
  const requests = (requestsRes.data ?? []) as unknown as Req[];
  const weekChanges = (source: string) =>
    changes.filter((c) => c.source === source && c.created_at >= weekAgo && !c.reverted_at).length;
  const activeRequests = requests.filter((r) => r.status === "open" || r.status === "in_progress").length;
  const [latestReport, ...olderReports] = reports;
  const lastAlertAt = (lastAlertRes.data as { created_at: string } | null)?.created_at;

  const roleStats: Record<RoleKey, RoleStat[]> = {
    daily: [
      { label: "열린 알림", value: `${alerts.length}건` },
      { label: "이번 주 수정", value: `${weekChanges("daily")}건` },
      { label: "최근 점검", value: lastAlertAt ? fmt(lastAlertAt) : "아직 없음" },
    ],
    weekly: [{ label: "최근 보고", value: latestReport ? fmt(latestReport.created_at) : "아직 없음" }],
    voice: [{ label: "이번 주 기록", value: `${weekChanges("voice")}건` }],
    system: [
      { label: "처리 대기 요청", value: `${activeRequests}건` },
      { label: "올린 PR", value: `${requests.filter((r) => r.pr_url).length}건` },
    ],
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-zinc-900 flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand" />
          AI 직원
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          담당 4명이 나눠서 일합니다. AI 가 수정한 내용은 전부 아래 기록에 남고 되돌릴 수 있어요.
        </p>
      </div>

      <RoleCards stats={roleStats} />

      {/* 알림 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5 mb-3">
          <Bell className="w-4 h-4 text-brand" /> 확인이 필요한 것 <RoleTag role="daily" />
        </h2>
        {alerts.length === 0 ? (
          <div className="text-[12.5px] text-zinc-400 py-6 text-center">열린 알림이 없습니다</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((p) => {
              const badge = SEVERITY_BADGE[p.severity] ?? SEVERITY_BADGE.info;
              return (
                <div key={p.id} className={`flex items-start gap-3 p-3 rounded-lg border ${SEVERITY_STYLE[p.severity] ?? SEVERITY_STYLE.info}`}>
                  <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${badge.cls}`}>{badge.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-zinc-900">
                      {p.title}
                      {p.company_id && p.companies ? (
                        <Link href={`/admin/companies/${p.company_id}`} className="ml-2 text-[11.5px] font-normal text-brand hover:underline">
                          {p.companies.name} →
                        </Link>
                      ) : null}
                    </div>
                    {p.body ? <div className="text-[12px] text-zinc-600 mt-1 whitespace-pre-wrap">{p.body}</div> : null}
                    <div className="text-[10.5px] text-zinc-400 mt-1">{fmt(p.created_at)}</div>
                  </div>
                  <PostButtons id={p.id} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 주간 보고 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5 mb-3">
          <FileText className="w-4 h-4 text-brand" /> 주간 보고 <RoleTag role="weekly" />
        </h2>
        {latestReport ? (
          <>
            <div className="text-[13.5px] font-semibold text-zinc-900">{latestReport.title}</div>
            <div className="text-[10.5px] text-zinc-400 mb-2">{fmt(latestReport.created_at)}</div>
            <div className="text-[12.5px] text-zinc-800 whitespace-pre-wrap leading-relaxed">{latestReport.body}</div>
            {olderReports.length > 0 ? (
              <details className="mt-4">
                <summary className="text-[12px] text-zinc-500 cursor-pointer">지난 보고 {olderReports.length}건</summary>
                <div className="space-y-4 mt-3">
                  {olderReports.map((r) => (
                    <div key={r.id} className="border-t border-zinc-100 pt-3">
                      <div className="text-[13px] font-semibold text-zinc-800">{r.title}</div>
                      <div className="text-[10.5px] text-zinc-400 mb-1">{fmt(r.created_at)}</div>
                      <div className="text-[12px] text-zinc-700 whitespace-pre-wrap">{r.body}</div>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </>
        ) : (
          <div className="text-[12.5px] text-zinc-400 py-6 text-center">첫 주간 보고는 다음 월요일 아침에 올라옵니다</div>
        )}
      </section>

      {/* 개선 요청함 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5 mb-1">
          <MessageSquarePlus className="w-4 h-4 text-brand" /> 개선 요청함 <RoleTag role="system" />
        </h2>
        <p className="text-[11.5px] text-zinc-500 mb-3">
          ERP 에서 바꾸고 싶은 점을 적어두면 AI 직원이 코드를 고쳐 검토용 제안(PR)으로 올립니다. 승인해야 반영돼요.
        </p>
        <RequestForm />
        {requests.length > 0 ? (
          <div className="mt-4 space-y-2">
            {requests.map((r) => {
              const st = REQ_STATUS[r.status] ?? REQ_STATUS.open;
              return (
                <div key={r.id} className="p-3 rounded-lg bg-zinc-50/60 border border-zinc-100">
                  <div className="flex items-start gap-2">
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${st.cls}`}>{st.label}</span>
                    <div className="flex-1 min-w-0 text-[12.5px] text-zinc-900 whitespace-pre-wrap">{r.body}</div>
                    {r.status === "open" ? <CancelRequestButton id={r.id} /> : null}
                  </div>
                  <div className="text-[10.5px] text-zinc-400 mt-1">
                    {r.profiles?.name ?? ""} · {fmt(r.created_at)}
                  </div>
                  {r.ai_reply ? (
                    <div className="mt-2 text-[12px] text-zinc-700 bg-white border border-zinc-100 rounded-md p-2 whitespace-pre-wrap">
                      🤖 {r.ai_reply}
                    </div>
                  ) : null}
                  {r.pr_url ? (
                    <a href={r.pr_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-brand hover:underline">
                      검토용 제안(PR) 보기 <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* 변경 기록 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5 mb-3">
          <History className="w-4 h-4 text-brand" /> AI 가 수정한 기록
        </h2>
        {changes.length === 0 ? (
          <div className="text-[12.5px] text-zinc-400 py-6 text-center">아직 수정한 내용이 없습니다</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {changes.map((c) => (
              <div key={c.id} className={`flex items-start gap-3 py-2.5 ${c.reverted_at ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-zinc-900">
                    <span className="font-semibold">{ACTION_LABEL[c.action] ?? c.action}</span>
                    {c.company_id && c.companies ? (
                      <Link href={`/admin/companies/${c.company_id}`} className="ml-1.5 text-brand hover:underline">
                        {c.companies.name}
                      </Link>
                    ) : null}
                    {c.reverted_at ? <span className="ml-1.5 text-[11px] text-zinc-500">(되돌림)</span> : null}
                  </div>
                  <div className="text-[12px] text-zinc-600 mt-0.5 break-words">{describeChange(c)}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {sourceName(c.source)} · 근거: {c.reason} · {fmt(c.created_at)}
                  </div>
                </div>
                {c.reverted_at ? null : <RevertButton id={c.id} />}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function sourceName(source: string) {
  return AI_ROLES.find((r) => r.key === source)?.name ?? "AI 직원";
}
