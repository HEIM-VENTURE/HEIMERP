import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SALES_STAGE_LABELS,
  SALES_STAGES_ORDER,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
  CONSULTING_STAGES_ORDER,
  PROGRAM_GRADE_LABELS,
  PROGRAM_GRADE_COLORS,
  TODO_STATUS_LABELS,
  FILE_KIND_LABELS,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

type Params = { id: string };

type Company = {
  id: number;
  name: string;
  address: string | null;
  ceo_name: string | null;
  phone: string | null;
  email: string | null;
  main_item: string | null;
  founded_at: string | null;
  last_year_revenue: number | null;
  inquiry_purpose: string | null;
  hvp_id: string | null;
  sales_stage: keyof typeof SALES_STAGE_LABELS;
  consulting_stage: keyof typeof CONSULTING_STAGE_LABELS | null;
  program_grade: keyof typeof PROGRAM_GRADE_LABELS | null;
  proposal_amount: number | null;
  fee_rate: number | null;
  drop_reason: string | null;
  received_at: string;
  contracted_at: string | null;
  started_at: string | null;
  notes: string | null;
  hvp?: { name: string; cohort: string | null } | null;
};

// 통합 단계 정의 (영업 5 + 컨설팅 8 - 'kickoff' 중복 제거 = 12개)
const UNIFIED_STAGES = [
  { key: "received",         label: "접수",                stage_type: "sales",     color: "bg-zinc-500" },
  { key: "meeting_1st",      label: "1차 미팅",            stage_type: "sales",     color: "bg-blue-500" },
  { key: "proposal",         label: "제안",                stage_type: "sales",     color: "bg-amber-500" },
  { key: "contract",         label: "계약",                stage_type: "sales",     color: "bg-purple-500" },
  { key: "kickoff",          label: "착수",                stage_type: "both",      color: "bg-emerald-500" },
  { key: "initial_review",   label: "초기 검토",           stage_type: "consulting",color: "bg-emerald-600" },
  { key: "dev_advisory",     label: "개발자문/사업계획",   stage_type: "consulting",color: "bg-teal-500" },
  { key: "ir_deck",          label: "IR Deck",             stage_type: "consulting",color: "bg-cyan-500" },
  { key: "tips_operator_ir", label: "TIPS 운영사 IR",      stage_type: "consulting",color: "bg-sky-500" },
  { key: "tips_review",      label: "TIPS 심사",           stage_type: "consulting",color: "bg-indigo-500" },
  { key: "fund_closing",     label: "조합 투자절차",       stage_type: "consulting",color: "bg-violet-500" },
  { key: "final_closing",    label: "Final Closing",       stage_type: "consulting",color: "bg-fuchsia-500" },
] as const;

function getCurrentUnifiedStageIndex(c: Company): number {
  if (c.sales_stage !== "kickoff") {
    return UNIFIED_STAGES.findIndex((s) => s.key === c.sales_stage);
  }
  // kickoff 이후 — consulting_stage로
  if (!c.consulting_stage) return 4; // 'kickoff' 기본
  return UNIFIED_STAGES.findIndex((s) => s.key === c.consulting_stage);
}

export default async function CompanyDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [companyRes, historyRes, meetingsRes, todosRes, filesRes, contractsRes] = await Promise.all([
    supabase.from("companies").select("*, hvp(name, cohort)").eq("id", id).single(),
    supabase.from("company_stage_history").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("meetings").select("*").eq("company_id", id).order("meeting_date", { ascending: false }),
    supabase.from("todos").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("files").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("company_id", id),
  ]);

  const company = companyRes.data as Company | null;
  if (!company) notFound();

  const history = historyRes.data ?? [];
  const meetings = meetingsRes.data ?? [];
  const todos = todosRes.data ?? [];
  const files = filesRes.data ?? [];
  const contracts = contractsRes.data ?? [];

  const currentIdx = getCurrentUnifiedStageIndex(company);

  // 활동 피드 합치기 (모든 이벤트를 시간순)
  type Activity = {
    when: string;
    type: "received" | "stage" | "meeting" | "todo" | "file" | "contract";
    title: string;
    sub?: string;
    color: string;
  };

  const activities: Activity[] = [
    {
      when: company.received_at,
      type: "received",
      title: "기업 접수",
      sub: company.inquiry_purpose ?? undefined,
      color: "bg-zinc-500",
    },
    ...history.map((h: any) => ({
      when: h.created_at,
      type: "stage" as const,
      title: `단계 변경: ${labelOf(h.from_stage)} → ${labelOf(h.to_stage)}`,
      sub: h.note ?? undefined,
      color: h.stage_type === "consulting" ? "bg-blue-500" : "bg-purple-500",
    })),
    ...meetings.map((m: any) => ({
      when: m.meeting_date,
      type: "meeting" as const,
      title: `${m.sequence ?? "미팅"} — ${m.title ?? "회의록"}`,
      sub: m.attendees ?? undefined,
      color: "bg-amber-500",
    })),
    ...todos.map((t: any) => ({
      when: t.completed_at ?? t.created_at,
      type: "todo" as const,
      title: `${t.status === "done" ? "✓ " : "○ "}${t.title}`,
      sub: t.due_date ? `마감 ${t.due_date}` : undefined,
      color: t.status === "done" ? "bg-emerald-400" : "bg-zinc-300",
    })),
    ...files.map((f: any) => ({
      when: f.created_at,
      type: "file" as const,
      title: `📎 ${f.filename}`,
      sub: FILE_KIND_LABELS[f.kind as keyof typeof FILE_KIND_LABELS] ?? "기타",
      color: "bg-sky-500",
    })),
    ...contracts.map((c: any) => ({
      when: c.contracted_at,
      type: "contract" as const,
      title: `📜 계약 — ${Number(c.total_amount).toLocaleString()}만원`,
      sub: `HVP 수수료 ${Math.round(Number(c.hvp_fee_amount ?? 0)).toLocaleString()}만 · ${c.payment_status === "paid" ? "지급 완료" : "지급 예정"}`,
      color: "bg-purple-500",
    })),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  // 미완료 To-do
  const openTodos = todos.filter((t: any) => t.status !== "done");
  const totalFee = contracts.reduce((s, c: any) => s + Number(c.hvp_fee_amount ?? 0), 0);

  return (
    <>
      {/* 헤더 */}
      <div className="text-xs text-zinc-400 mb-2">
        <Link href="/admin/pipeline" className="hover:text-zinc-700">기업 파이프라인</Link>
        {" / "}
        <span className="text-zinc-600">{company.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
            {company.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900">{company.name}</h1>
              <span className={`px-2 py-0.5 text-xs rounded ${SALES_STAGE_COLORS[company.sales_stage]?.badge ?? "bg-zinc-100"}`}>
                {SALES_STAGE_LABELS[company.sales_stage]}
              </span>
              {company.program_grade ? (
                <span className={`px-2 py-0.5 text-xs rounded ${PROGRAM_GRADE_COLORS[company.program_grade]}`}>
                  {PROGRAM_GRADE_LABELS[company.program_grade]}
                  {company.proposal_amount ? ` ${company.proposal_amount}만` : ""}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-500">
              {[company.main_item, company.address, company.ceo_name && `대표 ${company.ceo_name}`].filter(Boolean).join(" · ") || "추가 정보 없음"}
            </p>
            {company.hvp ? (
              <p className="text-xs text-zinc-400 mt-1">담당 HVP: {company.hvp.name} {company.hvp.cohort ? `(${company.hvp.cohort})` : ""}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 통합 12단계 타임라인 — 한 회사 여정 */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-zinc-900">전체 여정</h2>
          <span className="text-xs text-zinc-500">
            {currentIdx + 1}/{UNIFIED_STAGES.length} 단계 · {Math.round(((currentIdx + 1) / UNIFIED_STAGES.length) * 100)}%
          </span>
        </div>

        {/* 단계 바 */}
        <div className="relative">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-zinc-100" />
          <div className="absolute top-3 left-0 h-0.5 bg-gradient-to-r from-zinc-500 via-blue-500 to-emerald-500"
               style={{ width: `${((currentIdx + 1) / UNIFIED_STAGES.length) * 100}%` }} />
          <div className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${UNIFIED_STAGES.length}, 1fr)` }}>
            {UNIFIED_STAGES.map((s, i) => {
              const done = i < currentIdx;
              const current = i === currentIdx;
              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                    done ? s.color : current ? `${s.color} ring-4 ring-zinc-100` : "bg-white border-2 border-zinc-200"
                  }`}>
                    {done ? "✓" : current ? "●" : ""}
                  </div>
                  <div className={`text-[10px] mt-2 leading-tight ${
                    current ? "text-zinc-900 font-bold" : done ? "text-zinc-700" : "text-zinc-400"
                  }`}>
                    {s.label}
                  </div>
                  {(done || current) && getStageDate(company, s.key, history) ? (
                    <div className="text-[9px] text-zinc-400 mt-0.5">{formatDate(getStageDate(company, s.key, history))}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* 단계 그룹 라벨 */}
        <div className="flex mt-6 text-[10px] text-zinc-500">
          <div className="text-center" style={{ width: `${(4 / UNIFIED_STAGES.length) * 100}%` }}>📋 영업 단계</div>
          <div className="text-center" style={{ width: `${(8 / UNIFIED_STAGES.length) * 100}%` }}>💼 컨설팅 단계</div>
        </div>
      </div>

      {/* 2단 레이아웃: 좌측 활동 피드, 우측 사이드 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 활동 피드 */}
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">활동 피드</h2>
            <span className="text-xs text-zinc-400">{activities.length}개 이벤트</span>
          </div>
          {activities.length === 0 ? (
            <div className="text-center py-6 text-sm text-zinc-400">아직 활동이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-900">{a.title}</div>
                    {a.sub ? <div className="text-xs text-zinc-500 mt-0.5">{a.sub}</div> : null}
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">{formatRelative(a.when)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 우측 사이드 */}
        <div className="space-y-4">
          {/* 기본 정보 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">기본 정보</h3>
            <div className="space-y-2 text-xs">
              <Info label="대표자" value={company.ceo_name} />
              <Info label="연락처" value={company.phone} />
              <Info label="이메일" value={company.email} />
              <Info label="설립일" value={company.founded_at} />
              <Info label="매출(전년)" value={company.last_year_revenue ? `${company.last_year_revenue}백만` : null} />
              <Info label="접수일" value={company.received_at} />
              {company.contracted_at ? <Info label="계약일" value={company.contracted_at} /> : null}
              {company.started_at ? <Info label="착수일" value={company.started_at} /> : null}
            </div>
          </div>

          {/* 미완료 To-do */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900">진행중 To-do</h3>
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{openTodos.length}</span>
            </div>
            {openTodos.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-2">없음 ✨</div>
            ) : (
              <div className="space-y-2 text-xs">
                {openTodos.slice(0, 6).map((t: any) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <span className="text-zinc-300 mt-0.5">○</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-700 truncate">{t.title}</div>
                      <div className="text-zinc-400">{t.due_date ?? "—"}</div>
                    </div>
                  </div>
                ))}
                {openTodos.length > 6 ? (
                  <div className="text-xs text-zinc-400 pt-1">+ {openTodos.length - 6}개 더</div>
                ) : null}
              </div>
            )}
          </div>

          {/* 계약·수수료 */}
          {contracts.length > 0 ? (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">계약·수수료</h3>
              <div className="text-lg font-bold text-zinc-900">
                {contracts.reduce((s, c: any) => s + Number(c.total_amount ?? 0), 0).toLocaleString()}만
                <span className="text-xs font-normal text-zinc-500"> 컨설팅</span>
              </div>
              <div className="text-sm text-emerald-700 font-medium mt-1">
                → HVP 수수료 {Math.round(totalFee).toLocaleString()}만
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900">{value || <span className="text-zinc-300">—</span>}</span>
    </div>
  );
}

function labelOf(key: string | null): string {
  if (!key) return "—";
  return (SALES_STAGE_LABELS as any)[key] ?? (CONSULTING_STAGE_LABELS as any)[key] ?? key;
}

function getStageDate(company: Company, stageKey: string, history: any[]): string | null {
  // 단계 진입일 추정
  if (stageKey === "received") return company.received_at;
  if (stageKey === "contract") return company.contracted_at;
  if (stageKey === "kickoff") return company.started_at;
  // history에서 가장 최근 진입일
  const found = history.find((h) => h.to_stage === stageKey);
  return found?.created_at?.split("T")[0] ?? null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function formatRelative(iso: string): string {
  if (!iso) return "—";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "방금";
    return `${hours}시간 전`;
  }
  if (days < 7) return `${days}일 전`;
  if (days < 60) return `${Math.floor(days / 7)}주 전`;
  const d = new Date(iso);
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
