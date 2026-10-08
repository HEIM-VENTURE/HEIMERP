import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  User,
  Calendar,
  TrendingUp,
  FileText,
  Coins,
  Target,
  Clock,
  Activity as ActivityIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
  PROGRAM_GRADE_LABELS,
  PROGRAM_GRADE_COLORS,
  FILE_KIND_LABELS,
} from "@/lib/labels";
import { StageChanger } from "./stage-changer";
import { TipsMatches } from "./tips-match";
import { NewMeetingModal } from "./new-meeting-modal";
import { EditableCompanyField } from "./inline-edit";
import {
  NewContractModal,
  EditContractRow,
} from "../../contracts/contract-modals";
import { EditCompanyModal } from "../../pipeline/company-modals";
import { FileManager } from "./file-manager";
import { MeetingViewer, type MeetingRow } from "./meeting-viewer";
import { DeleteCompanyButton } from "./delete-company-button";
import { FollowupCard } from "./followup-card";
import { PaidStatusCard, type PaidRow } from "./paid-status-card";
import { NotesTimeline } from "./notes-timeline";
import { InvestorTappingCard } from "./investor-tapping-card";
import { JCurveCard } from "./jcurve-card";
import { CompanyPortalUsers, type PortalUser } from "./company-portal-users";

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
  custom_fields?: { pm?: string } | null;
  drive_folder_url: string | null;
  drive_folder_id: string | null;
  next_action: string | null;
  next_action_due: string | null;
  last_contact_at: string | null;
  growth_stage: number | null;
  growth_stage_note: string | null;
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

  const [companyRes, historyRes, meetingsRes, todosRes, filesRes, contractsRes, tipsListRes, matchesRes, applicationRes, notesRes, investorTappingRes, paidRes] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single(),
    supabase.from("company_stage_history").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("meetings").select("*").eq("company_id", id).order("meeting_date", { ascending: false }),
    supabase.from("todos").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("files").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("company_id", id).order("contracted_at", { ascending: false }),
    supabase.from("tips_operators").select("id, name, assigned_pm, focus_area").order("name", { ascending: true }),
    supabase
      .from("company_tips_matches")
      .select("id, tips_operator_id, valuation, investment, program")
      .eq("company_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("applications")
      .select("id, application_no, received_at, status")
      .eq("company_id", id)
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("company_notes")
      .select("id, body, pinned, created_at, author_id")
      .eq("company_id", id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("investor_tappings")
      .select("id, personal_fund_eligible, lips_eligible, tips_eligible, progress_status, confirmed_operator, pm")
      .eq("company_id", id)
      .maybeSingle(),
    supabase
      .from("paid_customers")
      .select("id, is_paid, urgency, target_program, new_corp_setup, new_company_name, ir_deck_tips, ir_deck_lips, demoday_1_a, demoday_1_b, demoday_2_a, demoday_2_b, offline, memo")
      .eq("company_id", id)
      .limit(1)
      .maybeSingle(),
  ]);

  const company = companyRes.data as Company | null;
  if (!company) notFound();

  const history = historyRes.data ?? [];
  const meetings = meetingsRes.data ?? [];
  const todos = todosRes.data ?? [];
  const files = filesRes.data ?? [];
  const contracts = contractsRes.data ?? [];
  const notesRaw = (notesRes.data ?? []) as {
    id: string;
    body: string;
    pinned: boolean;
    created_at: string;
    author_id: string | null;
  }[];

  // 노트 작성자 프로필 매핑
  const authorIds = Array.from(new Set(notesRaw.map((n) => n.author_id).filter((v): v is string => !!v)));
  const { data: noteProfiles } = authorIds.length
    ? await supabase.from("profiles").select("id, name, email").in("id", authorIds)
    : { data: [] as { id: string; name: string | null; email: string }[] };
  const noteAuthorMap = new Map((noteProfiles ?? []).map((p) => [p.id, p]));
  const notes = notesRaw.map((n) => ({
    ...n,
    author_name: n.author_id ? noteAuthorMap.get(n.author_id)?.name ?? null : null,
    author_email: n.author_id ? noteAuthorMap.get(n.author_id)?.email ?? null : null,
  }));

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // 이 기업에 연결된 포털 사용자들 (company_member)
  const { data: portalUsersData } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("company_id", company.id);
  const portalUsers = (portalUsersData ?? []) as PortalUser[];

  // 투자사 태핑 이벤트 조회
  const investorTapping = investorTappingRes.data as {
    id: string;
    personal_fund_eligible: string | null;
    lips_eligible: string | null;
    tips_eligible: string | null;
    progress_status: string | null;
    confirmed_operator: string | null;
    pm: string | null;
  } | null;
  let investorEvents: {
    id: string;
    sequence: number;
    operator: string;
    status: string;
    contact_date: string | null;
    notes: string | null;
  }[] = [];
  if (investorTapping?.id) {
    const { data: evs } = await supabase
      .from("tapping_events")
      .select("id, sequence, operator, status, contact_date, notes")
      .eq("tapping_id", investorTapping.id)
      .order("sequence", { ascending: true });
    investorEvents = (evs ?? []) as typeof investorEvents;
  }
  const tipsList = (tipsListRes.data as { id: string; name: string; assigned_pm: string | null; focus_area: string | null }[]) ?? [];
  const tipsMatches = (matchesRes.data as { id: number; tips_operator_id: string; valuation: number | null; investment: number | null; program: "TIPS" | "LIPS" }[]) ?? [];
  const application = applicationRes.data as { id: string; application_no: string; received_at: string; status: string } | null;

  const currentIdx = getCurrentUnifiedStageIndex(company);

  // 활동 피드 합치기 (모든 이벤트를 시간순)
  type Activity = {
    when: string;
    type: "received" | "stage" | "meeting" | "todo" | "file" | "contract";
    title: string;
    sub?: string;
    color: string;
    aiSummary?: string | null;
    meeting?: MeetingRow;
  };

  const activities: Activity[] = [
    {
      when: company.received_at,
      type: "received" as const,
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
      meeting: m as MeetingRow,
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
      sub: c.payment_status === "paid" ? "지급 완료" : "지급 예정",
      color: "bg-purple-500",
    })),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  // 미완료 To-do
  const openTodos = todos.filter((t: any) => t.status !== "done");

  const totalContracts = contracts.reduce((s, c: any) => s + Number(c.total_amount ?? 0), 0);
  const stageColor = SALES_STAGE_COLORS[company.sales_stage];

  return (
    <>
      {/* Breadcrumb */}
      <Link
        href="/admin/pipeline"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        기업 파이프라인
      </Link>

      {company.drop_reason ? (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 flex items-center gap-2">
          <span className="text-lg">⛔</span>
          <span>
            <b>드랍된 기업</b> — 사유: {company.drop_reason}
            <span className="text-rose-500 text-xs ml-2">(단계 변경 → 드랍 취소로 복구 가능)</span>
          </span>
        </div>
      ) : null}

      {/* ══════════ Hero Header ══════════ */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/15 to-brand-accent/10 border border-brand/10 flex items-center justify-center text-brand font-bold text-2xl shrink-0">
            {company.name.slice(0, 1)}
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ${
                  stageColor?.badge ?? "bg-zinc-100"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${stageColor?.dot ?? "bg-zinc-400"}`} />
                {SALES_STAGE_LABELS[company.sales_stage]}
                {company.consulting_stage
                  ? ` · ${CONSULTING_STAGE_LABELS[company.consulting_stage]}`
                  : ""}
              </span>
              {company.program_grade ? (
                <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${PROGRAM_GRADE_COLORS[company.program_grade]}`}>
                  {PROGRAM_GRADE_LABELS[company.program_grade]}
                  {company.proposal_amount ? ` · ${company.proposal_amount}만` : ""}
                </span>
              ) : null}
              {company.custom_fields?.pm ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 ml-1">
                  <User className="w-3 h-3" />
                  담당 {company.custom_fields.pm}
                </span>
              ) : null}
            </div>
            <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight mb-1.5">
              {company.name}
            </h1>
            <p className="text-[13.5px] text-zinc-600">
              {[company.main_item, company.address, company.ceo_name && `대표 ${company.ceo_name}`]
                .filter(Boolean)
                .join(" · ") || "추가 정보 없음"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0 items-start">
            {application ? (
              <Link
                href={`/admin/applications/${application.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-[12px] font-medium hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-colors"
                title={`원 신청서 ${application.application_no} 보기`}
              >
                <FileText className="w-3.5 h-3.5" />
                원 신청서
              </Link>
            ) : null}
            <EditCompanyModal
              company={{
                id: company.id,
                name: company.name,
                address: company.address,
                ceo_name: company.ceo_name,
                phone: company.phone,
                email: company.email,
                main_item: company.main_item,
                founded_at: company.founded_at,
                last_year_revenue: company.last_year_revenue,
                inquiry_purpose: company.inquiry_purpose,
                proposal_amount: company.proposal_amount,
                program_grade: company.program_grade,
                pm: company.custom_fields?.pm ?? null,
                notes: company.notes,
                received_at: company.received_at,
                contracted_at: company.contracted_at,
                lips_eligible: investorTapping?.lips_eligible ?? null,
                tips_eligible: investorTapping?.tips_eligible ?? null,
                personal_fund_eligible: investorTapping?.personal_fund_eligible ?? null,
                portal_invite_emails: (company as unknown as { portal_invite_emails?: string[] | null }).portal_invite_emails ?? null,
              }}
            />
            <NewMeetingModal companyId={company.id} />
            <StageChanger
              companyId={company.id}
              currentSalesStage={company.sales_stage}
              currentConsultingStage={company.consulting_stage}
              currentDropReason={company.drop_reason}
            />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-2 mt-6 pt-5 border-t border-zinc-100">
          <QuickStat
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="접수일"
            value={company.received_at?.split("T")[0] ?? "—"}
          />
          <QuickStat
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="전년 매출"
            value={formatRevenue(company.last_year_revenue) ?? "—"}
          />
          <QuickStat
            icon={<Coins className="w-3.5 h-3.5" />}
            label="계약 누계"
            value={contracts.length > 0 ? `${totalContracts.toLocaleString()}만` : "—"}
          />
          <QuickStat
            icon={<Target className="w-3.5 h-3.5" />}
            label="진행중 To-do"
            value={openTodos.length > 0 ? `${openTodos.length}건` : "없음"}
          />
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
          <div className="absolute top-3 left-0 h-0.5 bg-gradient-to-r from-slate-400 via-[#5a7187] to-green-500"
               style={{ width: `${((currentIdx + 1) / UNIFIED_STAGES.length) * 100}%` }} />
          <div className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${UNIFIED_STAGES.length}, 1fr)` }}>
            {UNIFIED_STAGES.map((s, i) => {
              const done = i < currentIdx;
              const current = i === currentIdx;
              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                    done ? "bg-[#5a7187]" : current ? "bg-orange-500 ring-4 ring-orange-100" : "bg-white border-2 border-zinc-200"
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

      {/* 2단 레이아웃:
          - 좌측 (넓음, 이력·활동·산출물): 활동 피드 → 계약 → 자료 → 프로젝트/투자딜 placeholder
          - 우측 (좁음, 요약·참조, lg 이상 sticky): 기본 정보 → TIPS → 진행중 To-do
          - lg 미만: 자동 세로 스택 */}
      {/* 성장 단계 J-커브 (Hero 바로 아래 full-width) */}
      <div className="mb-6">
        <JCurveCard
          companyId={company.id}
          currentStep={company.growth_stage}
          note={company.growth_stage_note}
          inferInput={{
            last_year_revenue: company.last_year_revenue,
            headcount: (company.custom_fields as { headcount?: number } | null)?.headcount ?? null,
            founded_at: company.founded_at,
            committed_count: investorEvents.filter((e) => e.status === "committed").length,
            interested_count: investorEvents.filter((e) => e.status === "interested" || e.status === "reviewing").length,
            passed_count: investorEvents.filter((e) => e.status === "passed").length,
            consulting_stage: company.consulting_stage,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 좌측 (이력·활동) ── */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* 담당자 노트 타임라인 */}
          <NotesTimeline
            companyId={company.id}
            notes={notes}
            currentUserId={currentUser?.id ?? null}
          />

          {/* 투자사 태핑 현황 */}
          <InvestorTappingCard
            companyId={company.id}
            tapping={investorTapping}
            events={investorEvents}
          />

          {/* 활동 피드 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6">
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-zinc-900">{a.title}</div>
                        <span className="text-xs text-zinc-400 shrink-0">{formatRelative(a.when)}</span>
                      </div>
                      {a.sub ? <div className="text-xs text-zinc-500 mt-0.5">{a.sub}</div> : null}
                      {a.meeting ? <MeetingViewer meeting={a.meeting} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 계약 (계약 메뉴는 숨김 — 기존 계약이 있는 기업만 표시) */}
          {contracts.length > 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900">계약</h3>
              <NewContractModal
                companies={[{
                  id: company.id,
                  name: company.name,
                  proposal_amount: company.proposal_amount,
                }]}
                defaultCompanyId={company.id}
              />
            </div>

            {contracts.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-3">
                계약 없음 — &quot;계약&quot; 단계 진입 시 자동 생성
              </div>
            ) : (
              <>
                <div className="mb-3 p-3 bg-zinc-50 rounded-lg">
                  <div className="text-lg font-bold text-zinc-900">
                    {contracts.reduce((s, c: any) => s + Number(c.total_amount ?? 0), 0).toLocaleString()}만
                    <span className="text-xs font-normal text-zinc-500"> 컨설팅</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {contracts.map((c: any) => (
                    <div key={c.id} className="border-t border-zinc-100 pt-3 first:border-0 first:pt-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-xs text-zinc-500">{c.contracted_at}</div>
                        <EditContractRow
                          contract={{
                            id: c.id,
                            company_id: c.company_id,
                            contracted_at: c.contracted_at,
                            total_amount: Number(c.total_amount),
                            notes: c.notes,
                          }}
                          companyName={company.name}
                        />
                      </div>
                      <div className="text-sm font-medium text-zinc-900">
                        {Number(c.total_amount).toLocaleString()}만원
                      </div>
                      {c.notes ? (
                        <div className="text-[11px] text-zinc-400 mt-1.5 italic">{c.notes}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          ) : null}

          {/* 자료 */}
          <FileManager companyId={company.id} files={files as any} />

        </div>

        {/* ── 우측 (요약·참조 · lg 이상 sticky) ── */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start min-w-0">
          {/* 후속 관리 카드 (최상단) */}
          <FollowupCard
            companyId={company.id}
            driveUrl={company.drive_folder_url}
            nextAction={company.next_action}
            nextActionDue={company.next_action_due}
            lastContactAt={company.last_contact_at}
          />

          {/* 결제·진행 현황 (구 고객 현황표) */}
          <PaidStatusCard
            companyId={company.id}
            companyName={company.name}
            row={(paidRes.data as PaidRow | null) ?? null}
          />

          {/* 기본 정보 (셀 클릭 인라인 편집) */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900">기본 정보</h3>
              <span className="text-[10px] text-zinc-400">셀 클릭 → 편집</span>
            </div>
            <div className="space-y-2 text-xs">
              <EditableCompanyField
                companyId={company.id}
                field="ceo_name"
                label="대표자"
                value={company.ceo_name}
                placeholder="홍길동"
              />
              <Info label="담당 PM" value={company.custom_fields?.pm ?? null} />
              <EditableCompanyField
                companyId={company.id}
                field="phone"
                label="연락처"
                value={company.phone}
                placeholder="010-0000-0000"
              />
              <EditableCompanyField
                companyId={company.id}
                field="email"
                label="이메일"
                value={company.email}
                placeholder="hello@company.com"
              />
              <EditableCompanyField
                companyId={company.id}
                field="founded_at"
                label="설립일"
                value={company.founded_at}
                placeholder="YYYY-MM-DD"
                type="date"
              />
              <EditableCompanyField
                companyId={company.id}
                field="last_year_revenue"
                label="매출(전년)"
                value={company.last_year_revenue}
                placeholder="백만원 단위"
                type="number"
                displayNode={
                  company.last_year_revenue == null ? (
                    <span className="text-zinc-300">—</span>
                  ) : (
                    <span className="text-zinc-900 tabular-nums">
                      {formatRevenue(Number(company.last_year_revenue)) ?? "—"}
                    </span>
                  )
                }
              />
              <Info label="접수일" value={company.received_at} />
              <Info label="계약일" value={company.contracted_at} />
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100">
              <div className="text-xs text-zinc-500 mb-1.5">접수 목적</div>
              <EditableCompanyField
                companyId={company.id}
                field="inquiry_purpose"
                value={company.inquiry_purpose}
                placeholder="접수 시 남긴 목적…"
                multiline
                displayNode={
                  company.inquiry_purpose ? (
                    <div className="text-xs text-zinc-700 whitespace-pre-wrap break-words text-left">
                      {company.inquiry_purpose}
                    </div>
                  ) : (
                    <span className="text-zinc-300 text-xs">—</span>
                  )
                }
                className="w-full block"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-100">
              <div className="text-xs text-zinc-500 mb-1.5">추가 메모</div>
              <EditableCompanyField
                companyId={company.id}
                field="notes"
                value={company.notes}
                placeholder="내부 코멘트·후속 액션·참고 링크…"
                multiline
                displayNode={
                  company.notes ? (
                    <div className="text-xs text-zinc-700 whitespace-pre-wrap break-words text-left">
                      {company.notes}
                    </div>
                  ) : (
                    <span className="text-zinc-300 text-xs">—</span>
                  )
                }
                className="w-full block"
              />
            </div>
          </div>

          {/* TIPS 운영사 매칭 (여러 곳 가능) */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">TIPS 운영사 매칭</h3>
            <TipsMatches
              companyId={company.id}
              matches={tipsMatches}
              operators={tipsList}
            />
          </div>

          {/* 진행중 To-do */}
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
        </aside>
      </div>

      {/* 기업 포털 사용자 매핑 */}
      <div className="mt-8">
        <CompanyPortalUsers companyId={company.id} users={portalUsers} />
      </div>

      {/* 위험 구역 · 기업 완전 삭제 */}
      <div className="mt-8 pt-6 border-t border-rose-100">
        <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[13px] font-semibold text-rose-700 mb-1">위험 구역</div>
              <div className="text-[12px] text-zinc-600 leading-relaxed">
                기업을 완전 삭제하면 관련 미팅·자료·업무 이력이 모두 사라지며 되돌릴 수 없습니다.
                <br />
                일반적으로는 <b>드랍 처리</b>(파이프라인 목록에서 자동 제외 + 데이터 보존)를 권장합니다.
              </div>
            </div>
            <DeleteCompanyButton companyId={company.id} companyName={company.name} />
          </div>
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

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 font-medium">
        <span className="text-zinc-400">{icon}</span>
        {label}
      </div>
      <div className="text-[15px] text-zinc-900 font-semibold tabular-nums mt-0.5">{value}</div>
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

/** DB는 백만원 단위로 저장. 표시는 항상 억 단위(소수 최대 1자리). */
function formatRevenue(millions: number | null): string | null {
  if (millions == null) return null;
  const eok = millions / 100;
  // 정수면 정수, 소수면 1자리, 끝의 .0 제거
  const display = Number.isInteger(eok) ? eok.toString() : eok.toFixed(1).replace(/\.0$/, "");
  return `${display}억`;
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
