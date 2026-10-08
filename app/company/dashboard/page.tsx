import {
  Building2,
  Coins,
  Target,
  Clock,
  User,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { stageMeta, ZONE_META } from "@/lib/growth-stages";
import { JCurveSvgLarge } from "@/app/admin/companies/[id]/jcurve-card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  contacted: "컨택",
  meeting: "미팅",
  reviewing: "검토",
  interested: "관심",
  committed: "확약",
  passed: "드랍",
  hold: "보류",
};
const STATUS_STYLE: Record<string, string> = {
  contacted: "bg-slate-100 text-slate-700",
  meeting: "bg-blue-100 text-blue-700",
  reviewing: "bg-violet-100 text-violet-700",
  interested: "bg-amber-100 text-amber-700",
  committed: "bg-emerald-100 text-emerald-700",
  passed: "bg-rose-100 text-rose-700",
  hold: "bg-stone-100 text-stone-700",
};

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, company_id")
    .eq("id", user.id)
    .single();

  const companyId = profile?.company_id;

  if (!companyId) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">환영합니다</h1>
        <p className="text-sm text-zinc-500 mb-6">
          <b>{profile?.name || profile?.email}</b> 님, 하임벤처투자 기업 포털입니다.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
          <div className="font-semibold mb-1">⚙️ 회사 연결이 아직 되지 않았습니다</div>
          <p className="mt-1 text-amber-800">
            하임 담당자에게 이메일을 전달해주세요: <b className="font-mono">{profile?.email}</b>
          </p>
          <p className="mt-2 text-[12.5px] text-amber-700">
            담당자가 회사와 연결하면 자동으로 포털이 열립니다.
          </p>
        </div>
      </div>
    );
  }

  const [companyRes, tappingRes, notesRes] = await Promise.all([
    supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
    supabase
      .from("investor_tappings")
      .select("id, lips_eligible, tips_eligible, personal_fund_eligible, progress_status, confirmed_operator")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("company_notes")
      .select("id, body, pinned, created_at")
      .eq("company_id", companyId)
      .eq("pinned", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const company = companyRes.data;
  if (!company) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-sm text-rose-900">
        회사 정보를 불러올 수 없습니다. 담당자에게 문의해주세요.
      </div>
    );
  }

  const tapping = tappingRes.data;
  let events: {
    id: string;
    sequence: number;
    operator: string;
    status: string;
    contact_date: string | null;
  }[] = [];
  if (tapping?.id) {
    const { data: evs } = await supabase
      .from("tapping_events")
      .select("id, sequence, operator, status, contact_date")
      .eq("tapping_id", tapping.id)
      .order("sequence", { ascending: true });
    events = (evs ?? []) as typeof events;
  }

  const notes = notesRes.data ?? [];
  const current = stageMeta(company.growth_stage);
  const zoneMeta = current ? ZONE_META[current.zone] : null;

  const byOperator = new Map<string, typeof events>();
  for (const e of events) {
    const arr = byOperator.get(e.operator) ?? [];
    arr.push(e);
    byOperator.set(e.operator, arr);
  }

  const dueDiff = company.next_action_due
    ? Math.floor((new Date(company.next_action_due).getTime() - Date.now()) / 86400000)
    : null;
  const pm = (company.custom_fields as { pm?: string } | null)?.pm;

  return (
    <div className="max-w-5xl space-y-5">
      {/* 환영 헤더 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand" />
            {company.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            하임벤처투자 기업 포털 · 성장 현황을 한눈에
          </p>
        </div>
        {pm ? (
          <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
            <User className="w-3.5 h-3.5 text-brand" />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">담당 PM</div>
              <div className="text-[13px] font-semibold text-zinc-900">{pm}</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 성장 단계 J-커브 */}
      <section className="bg-gradient-to-br from-white to-brand/5 border border-brand/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-zinc-900 inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" />
              성장 단계 (J-커브)
            </h2>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">
              하임이 보는 우리 회사의 현재 성장 단계
            </p>
          </div>
          {current ? (
            <div className="text-right">
              <div className="text-[32px] font-bold text-brand tabular-nums leading-none">
                {current.step}
              </div>
              <div className="text-[13px] font-semibold text-zinc-900">{current.label}</div>
            </div>
          ) : null}
        </div>
        <div className="rounded-xl bg-white border border-zinc-100 p-5 mb-3">
          <JCurveSvgLarge currentStep={company.growth_stage ?? null} />
        </div>
        {current && zoneMeta ? (
          <div
            className="text-[12px] px-3 py-2 rounded-md inline-block"
            style={{ background: zoneMeta.bg, color: zoneMeta.color }}
          >
            <b>{zoneMeta.label}</b> · {zoneMeta.sub}
          </div>
        ) : (
          <div className="text-[12.5px] text-zinc-500">
            아직 성장 단계가 설정되지 않았습니다. 하임 담당자가 평가 중입니다.
          </div>
        )}
        {company.growth_stage_note ? (
          <div className="mt-3 text-[12.5px] text-zinc-700 bg-white p-3 rounded-lg border border-zinc-100 whitespace-pre-wrap">
            <div className="text-[10.5px] font-semibold text-zinc-500 uppercase mb-1">
              현재 단계 핵심 과업
            </div>
            {company.growth_stage_note}
          </div>
        ) : null}
      </section>

      {/* 후속 관리 3열 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase">마지막 접촉</span>
          </div>
          {company.last_contact_at ? (
            <>
              <div className="text-[22px] font-bold text-zinc-900 tabular-nums">
                {company.last_contact_at}
              </div>
              <div className="text-[11.5px] text-zinc-500 mt-1">
                {(() => {
                  const d = Math.floor((Date.now() - new Date(company.last_contact_at).getTime()) / 86400000);
                  if (d === 0) return "오늘";
                  if (d < 7) return `${d}일 전`;
                  if (d < 30) return `${Math.floor(d / 7)}주 전`;
                  return `${Math.floor(d / 30)}개월 전`;
                })()}
              </div>
            </>
          ) : (
            <div className="text-[13px] text-zinc-400">접촉 기록 없음</div>
          )}
        </section>

        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase">다음 액션</span>
          </div>
          {company.next_action ? (
            <>
              <div className="text-[13px] font-medium text-zinc-900 whitespace-pre-wrap mb-1">
                {company.next_action}
              </div>
              {company.next_action_due ? (
                <div
                  className={`text-[11.5px] tabular-nums font-semibold ${
                    dueDiff !== null && dueDiff < 0
                      ? "text-rose-600"
                      : dueDiff !== null && dueDiff <= 3
                      ? "text-amber-600"
                      : "text-zinc-500"
                  }`}
                >
                  마감 {company.next_action_due}
                  {dueDiff !== null && (
                    dueDiff < 0 ? ` · ${-dueDiff}일 지남` :
                    dueDiff === 0 ? " · 오늘" :
                    ` · D-${dueDiff}`
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-[13px] text-zinc-400">예정된 액션 없음</div>
          )}
        </section>

        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase">투자 자격</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <EligibleBadge label="LIPS" value={tapping?.lips_eligible} />
            <EligibleBadge label="TIPS" value={tapping?.tips_eligible} />
            <EligibleBadge label="개투" value={tapping?.personal_fund_eligible} />
          </div>
          {tapping?.confirmed_operator ? (
            <div className="mt-2 text-[11.5px] text-brand">
              ✓ 운영사 확정: <b>{tapping.confirmed_operator}</b>
            </div>
          ) : null}
        </section>
      </div>

      {/* 투자사 태핑 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-brand" />
            투자사 태핑 현황
            <span className="text-[11px] text-zinc-400 font-normal">
              · 투자사 {byOperator.size}곳 · {events.length}건 접촉
            </span>
          </h2>
        </div>
        {byOperator.size === 0 ? (
          <div className="text-[12.5px] text-zinc-400 py-6 text-center">
            아직 투자사 태핑 이력이 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Array.from(byOperator.entries()).map(([operator, opEvents]) => {
              const last = opEvents[opEvents.length - 1];
              const style = STATUS_STYLE[last.status] ?? "bg-zinc-100 text-zinc-700";
              const label = STATUS_LABEL[last.status] ?? last.status;
              return (
                <div
                  key={operator}
                  className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50/60 border border-zinc-100"
                >
                  <span className={`inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold ${style}`}>
                    {label}
                  </span>
                  <span className="text-[13px] font-medium text-zinc-900 truncate flex-1">
                    {operator}
                  </span>
                  {opEvents.length > 1 ? (
                    <span className="text-[10.5px] text-zinc-400 font-mono">×{opEvents.length}</span>
                  ) : null}
                  {last.contact_date ? (
                    <span className="text-[10.5px] text-zinc-400 tabular-nums">
                      {last.contact_date}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 담당자 공유 메모 */}
      {notes.length > 0 ? (
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">📌 담당자 공유 메모</h2>
          <div className="space-y-2">
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 text-[12.5px] text-zinc-800 whitespace-pre-wrap"
              >
                {n.body}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="pt-4 border-t border-zinc-200 text-[11.5px] text-zinc-400">
        정보가 다르거나 수정이 필요하시면 담당 PM{pm ? ` (${pm})` : ""}에게 알려주세요. 자료 공유 메뉴는 Phase 3에서 열립니다.
      </div>
    </div>
  );
}

function EligibleBadge({ label, value }: { label: string; value: string | null | undefined }) {
  if (value === "여") return <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{label} ✓</span>;
  if (value === "부") return <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">{label} ×</span>;
  if (value === "대기중") return <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{label} ?</span>;
  return <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-400">{label} —</span>;
}
