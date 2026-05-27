import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  SALES_STAGE_LABELS,
  SALES_STAGES_ORDER,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
  PROGRAM_GRADE_COLORS,
  PROGRAM_GRADE_LABELS,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function HvpDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("hvp_id, name")
    .eq("id", user.id)
    .single();

  const myHvpId = profile?.hvp_id;

  // hvp info
  const { data: hvp } = myHvpId
    ? await supabase.from("hvp").select("name, cohort, default_fee_rate").eq("id", myHvpId).single()
    : { data: null };

  // 내 기업 (hvp_id 일치)
  const { data: myCompanies } = myHvpId
    ? await supabase
        .from("companies")
        .select("id, name, sales_stage, consulting_stage, program_grade, proposal_amount, received_at, started_at")
        .eq("hvp_id", myHvpId)
        .order("received_at", { ascending: false })
    : { data: [] };

  // 내 계약 (수수료)
  const { data: myContracts } = myHvpId
    ? await supabase
        .from("contracts")
        .select("id, total_amount, hvp_fee_amount, payment_status")
        .eq("hvp_id", myHvpId)
    : { data: [] };

  const companies = myCompanies ?? [];
  const contracts = myContracts ?? [];

  // 통계
  const totalMy = companies.length;
  const kickoffMy = companies.filter((c) => c.sales_stage === "kickoff").length;
  const conversionRate = totalMy > 0 ? Math.round((kickoffMy / totalMy) * 1000) / 10 : 0;

  const totalFeePaid = contracts
    .filter((c) => c.payment_status === "paid")
    .reduce((s, c) => s + Number(c.hvp_fee_amount ?? 0), 0);
  const totalFeeScheduled = contracts
    .filter((c) => c.payment_status === "scheduled")
    .reduce((s, c) => s + Number(c.hvp_fee_amount ?? 0), 0);
  const totalFee = totalFeePaid + totalFeeScheduled;

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthNew = companies.filter((c) => new Date(c.received_at) >= thisMonthStart).length;

  // 깔때기
  const funnel = SALES_STAGES_ORDER.map((s) => ({
    stage: s,
    label: SALES_STAGE_LABELS[s],
    count: companies.filter((c) => c.sales_stage === s).length,
    color: SALES_STAGE_COLORS[s].dot,
  }));
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  // HVP가 아직 연결 안 된 경우
  if (!myHvpId) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">HVP 대시보드</h1>
        <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          <div className="font-semibold mb-1.5">⚠️ HVP 정보가 연결되어 있지 않습니다</div>
          <p>관리자에게 HVP 등록 + 본 계정 연결을 요청해주세요. (profile.hvp_id 설정 필요)</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            안녕하세요, {hvp?.name ?? profile?.name}님 👋
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {hvp?.cohort ? `${hvp.cohort} · ` : ""}
            기본 수수료율 {((hvp?.default_fee_rate ?? 0.2) * 100).toFixed(0)}%
          </p>
        </div>
        <Button>+ 새 기업 접수</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="내가 데려온 기업"
          value={totalMy.toString()}
          delta={thisMonthNew > 0 ? `↑ ${thisMonthNew} (이번 달)` : "이번 달 신규 없음"}
          positive={thisMonthNew > 0}
        />
        <KpiCard
          label="착수 진행"
          value={kickoffMy.toString()}
          delta={totalMy > 0 ? `전환율 ${conversionRate}%` : "—"}
        />
        <KpiCard
          label="누적 수수료"
          value={Math.round(totalFee).toLocaleString()}
          unit="만원"
          delta={`지급 완료 ${Math.round(totalFeePaid).toLocaleString()}만`}
        />
        <KpiCard
          label="예정 수수료"
          value={Math.round(totalFeeScheduled).toLocaleString()}
          unit="만원"
          delta={
            contracts.filter((c) => c.payment_status === "scheduled").length > 0
              ? `${contracts.filter((c) => c.payment_status === "scheduled").length}건 정산 예정`
              : "—"
          }
          warning={totalFeeScheduled > 0}
        />
      </div>

      {/* 내 기업 리스트 */}
      <div className="bg-white border border-zinc-200 rounded-xl mb-6">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">내 기업 ({totalMy})</h2>
        </div>
        {companies.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            아직 데려온 기업이 없습니다. + 새 기업 접수 버튼으로 추가하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-zinc-500 bg-zinc-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">기업명</th>
                  <th className="text-left px-6 py-3 font-medium">단계</th>
                  <th className="text-left px-6 py-3 font-medium">컨설팅</th>
                  <th className="text-left px-6 py-3 font-medium">제안금액</th>
                  <th className="text-left px-6 py-3 font-medium">내 수수료 (20%)</th>
                  <th className="text-left px-6 py-3 font-medium">접수일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {companies.map((c) => {
                  const myFee = c.proposal_amount ? Math.round(Number(c.proposal_amount) * 0.2) : null;
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-3.5">
                        <Link href={`/admin/companies/${c.id}`} className="font-medium text-zinc-900">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded ${SALES_STAGE_COLORS[c.sales_stage as keyof typeof SALES_STAGE_COLORS]?.badge}`}
                        >
                          {SALES_STAGE_LABELS[c.sales_stage as keyof typeof SALES_STAGE_LABELS]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-zinc-600">
                        {c.consulting_stage
                          ? CONSULTING_STAGE_LABELS[c.consulting_stage as keyof typeof CONSULTING_STAGE_LABELS]
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-700">
                        {c.proposal_amount ? `${Number(c.proposal_amount).toLocaleString()}만` : "—"}
                        {c.program_grade ? (
                          <span
                            className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${PROGRAM_GRADE_COLORS[c.program_grade as keyof typeof PROGRAM_GRADE_COLORS]}`}
                          >
                            {PROGRAM_GRADE_LABELS[c.program_grade as keyof typeof PROGRAM_GRADE_LABELS]}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-zinc-900">
                        {myFee ? `${myFee.toLocaleString()}만` : <span className="text-zinc-400 font-normal">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-zinc-500">{c.received_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 깔때기 */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="font-semibold text-zinc-900 mb-5">전환 깔때기 (내 기업)</h2>
        {totalMy === 0 ? (
          <div className="text-center py-6 text-sm text-zinc-400">기업 데이터가 쌓이면 표시됩니다</div>
        ) : (
          <div className="flex items-end gap-2">
            {funnel.map((f, i) => {
              const heightPx = Math.max(20, (f.count / maxFunnel) * 100);
              return (
                <Fragment key={f.stage}>
                  <div className="flex-1">
                    <div
                      className={`text-2xl font-bold ${f.stage === "kickoff" ? "text-emerald-600" : "text-zinc-900"}`}
                    >
                      {f.count}
                    </div>
                    <div className={`${f.color} rounded-t-lg mt-2`} style={{ height: `${heightPx}px` }} />
                    <div className="text-xs text-zinc-500 mt-1.5 text-center">{f.label}</div>
                  </div>
                  {i < funnel.length - 1 ? <div className="text-zinc-300 text-xs pb-12">▶</div> : null}
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  unit,
  delta,
  positive,
  warning,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="text-xs text-zinc-500 mb-1.5">{label}</div>
      <div className="text-2xl font-bold text-zinc-900">
        {value}
        {unit ? <span className="text-sm font-medium text-zinc-500">{unit}</span> : null}
      </div>
      <div
        className={`text-xs mt-2 ${
          warning ? "text-amber-600" : positive ? "text-emerald-600" : "text-zinc-400"
        }`}
      >
        {delta}
      </div>
    </div>
  );
}
