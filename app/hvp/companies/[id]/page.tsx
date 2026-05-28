import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
  CONSULTING_STAGES_ORDER,
  PROGRAM_GRADE_LABELS,
  PROGRAM_GRADE_COLORS,
  hvpStageHint,
} from "@/lib/labels";
import { FileManager } from "../../../admin/companies/[id]/file-manager";
import { MeetingViewer, type MeetingRow } from "../../../admin/companies/[id]/meeting-viewer";

export const dynamic = "force-dynamic";

const UNIFIED_STAGES = [
  { key: "received",         label: "접수",                color: "bg-zinc-500" },
  { key: "meeting_1st",      label: "1차 미팅",            color: "bg-blue-500" },
  { key: "proposal",         label: "제안",                color: "bg-amber-500" },
  { key: "contract",         label: "계약",                color: "bg-purple-500" },
  { key: "kickoff",          label: "착수",                color: "bg-emerald-500" },
  { key: "initial_review",   label: "초기 검토",           color: "bg-emerald-600" },
  { key: "dev_advisory",     label: "개발자문",            color: "bg-teal-500" },
  { key: "ir_deck",          label: "IR Deck",             color: "bg-cyan-500" },
  { key: "tips_operator_ir", label: "TIPS 운영사 IR",      color: "bg-sky-500" },
  { key: "tips_review",      label: "TIPS 심사",           color: "bg-indigo-500" },
  { key: "fund_closing",     label: "조합 투자절차",       color: "bg-violet-500" },
  { key: "final_closing",    label: "Final Closing",       color: "bg-fuchsia-500" },
] as const;

export default async function HvpCompanyDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const welcome = sp.welcome === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // profile + company + 관련 데이터 전부 동시 (6개 쿼리 한 번에 RTT)
  const [profileRes, companyRes, meetingsRes, todosRes, contractsRes, filesRes] = await Promise.all([
    supabase.from("profiles").select("hvp_id, role").eq("id", user.id).single(),
    supabase.from("companies").select("*").eq("id", id).single(),
    supabase.from("meetings").select("*").eq("company_id", id).order("meeting_date", { ascending: false }),
    supabase.from("todos").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("company_id", id),
    supabase.from("files").select("*").eq("company_id", id).order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const company = companyRes.data;
  const files = filesRes.data ?? [];

  if (!company) notFound();

  // RLS가 이미 처리하지만, 명시적 검증
  if (profile?.role !== "admin" && company.hvp_id !== profile?.hvp_id) {
    redirect("/hvp/companies");
  }

  const meetings = meetingsRes.data ?? [];
  const todos = todosRes.data ?? [];
  const contracts = contractsRes.data ?? [];

  const currentIdx = (() => {
    if (company.sales_stage !== "kickoff") {
      return UNIFIED_STAGES.findIndex((s) => s.key === company.sales_stage);
    }
    if (!company.consulting_stage) return 4;
    return UNIFIED_STAGES.findIndex((s) => s.key === company.consulting_stage);
  })();

  const totalFee = contracts.reduce((s: number, c: any) => s + Number(c.hvp_fee_amount ?? 0), 0);
  const openTodos = todos.filter((t: any) => t.status !== "done");
  const myFee = company.proposal_amount ? Math.round(Number(company.proposal_amount) * Number(company.fee_rate ?? 0.2)) : null;

  return (
    <>
      <div className="text-xs text-zinc-400 mb-2">
        <Link href="/hvp/companies" className="hover:text-zinc-700">내 기업</Link>
        {" / "}
        <span className="text-zinc-600">{company.name}</span>
      </div>

      {welcome ? (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
          ✅ 기업 접수 완료! 관리자에게 알림이 가고 자동 To-do가 생성됐어요.
        </div>
      ) : null}

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
            {company.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900">{company.name}</h1>
              <span className={`px-2 py-0.5 text-xs rounded ${SALES_STAGE_COLORS[company.sales_stage as keyof typeof SALES_STAGE_COLORS]?.badge}`}>
                {SALES_STAGE_LABELS[company.sales_stage as keyof typeof SALES_STAGE_LABELS]}
              </span>
              {company.program_grade ? (
                <span className={`px-2 py-0.5 text-xs rounded ${PROGRAM_GRADE_COLORS[company.program_grade as keyof typeof PROGRAM_GRADE_COLORS]}`}>
                  {PROGRAM_GRADE_LABELS[company.program_grade as keyof typeof PROGRAM_GRADE_LABELS]}
                  {company.proposal_amount ? ` ${company.proposal_amount}만` : ""}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-500">
              {[company.main_item, company.address].filter(Boolean).join(" · ") || "추가 정보 없음"}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              · {hvpStageHint(company.sales_stage, company.consulting_stage)}
            </p>
          </div>
        </div>
      </div>

      {/* 통합 12단계 타임라인 */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-zinc-900">진행 상황</h2>
          <span className="text-xs text-zinc-500">
            {currentIdx + 1}/{UNIFIED_STAGES.length} 단계 · {Math.round(((currentIdx + 1) / UNIFIED_STAGES.length) * 100)}%
          </span>
        </div>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 좌측 2칸: 미팅·To-do 요약 */}
        <div className="col-span-2 space-y-4">
          {/* 최근 미팅 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">최근 미팅 ({meetings.length})</h3>
            {meetings.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-4">아직 미팅 기록이 없습니다</div>
            ) : (
              <div className="space-y-4">
                {meetings.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="text-sm border-l-2 border-zinc-200 pl-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-zinc-900 font-medium">{m.sequence ?? "미팅"}</span>
                      <span className="text-xs text-zinc-400">{m.meeting_date}</span>
                    </div>
                    {m.title ? <div className="text-zinc-700">{m.title}</div> : null}
                    {m.attendees ? <div className="text-xs text-zinc-500 mt-0.5">참석: {m.attendees}</div> : null}
                    <MeetingViewer meeting={m as MeetingRow} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* To-do */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">진행중 To-do ({openTodos.length})</h3>
            {openTodos.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-4">진행중 To-do가 없습니다 ✨</div>
            ) : (
              <div className="space-y-2 text-sm">
                {openTodos.slice(0, 8).map((t: any) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <span className="text-zinc-300 mt-0.5">○</span>
                    <div className="flex-1">
                      <div className="text-zinc-700">{t.title}</div>
                      <div className="text-xs text-zinc-400">{t.due_date ?? "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 기본정보 + 수수료 */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">회사 정보</h3>
            <div className="space-y-2 text-xs">
              <Info label="대표자" value={company.ceo_name} />
              <Info label="연락처" value={company.phone} />
              <Info label="이메일" value={company.email} />
              <Info label="설립일" value={company.founded_at} />
              <Info label="접수일" value={company.received_at} />
              {company.contracted_at ? <Info label="계약일" value={company.contracted_at} /> : null}
              {company.started_at ? <Info label="착수일" value={company.started_at} /> : null}
            </div>
          </div>

          {/* 내 수수료 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">내 수수료</h3>
            {contracts.length > 0 ? (
              <>
                <div className="text-lg font-bold text-emerald-900">
                  {Math.round(totalFee).toLocaleString()}만
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  {contracts.filter((c: any) => c.payment_status === "paid").length}건 지급 · {contracts.filter((c: any) => c.payment_status === "scheduled").length}건 예정
                </div>
              </>
            ) : myFee ? (
              <>
                <div className="text-lg font-bold text-zinc-900">~{myFee.toLocaleString()}만</div>
                <div className="text-xs text-zinc-500 mt-1">예상 수수료 · 계약 시 확정</div>
              </>
            ) : (
              <div className="text-xs text-zinc-500">계약·금액 확정 전</div>
            )}
          </div>

          {/* 자료 */}
          <FileManager companyId={company.id} files={files as any} />
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
