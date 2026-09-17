import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditCell, EligibleCell, AddTappingButton, DeleteRowButton } from "./tapping-cells";

type Row = {
  id: string;
  seq: number | null;
  company_id: number | null;
  company_name_snapshot: string;
  prev_revenue: string | null;
  headcount: string | null;
  established_at: string | null;
  personal_fund_eligible: string | null;
  lips_eligible: string | null;
  tips_eligible: string | null;
  progress_status: string | null;
  confirmed_operator: string | null;
  tapping_1: string | null;
  tapping_2: string | null;
  tapping_3: string | null;
  tapping_4: string | null;
  tapping_5: string | null;
};

export async function TappingTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investor_tappings")
    .select("*")
    .order("seq", { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-[13px] text-rose-700">
        태핑 데이터를 불러올 수 없습니다: {error.message}
        <br />
        <span className="text-[11.5px] text-rose-500">
          Supabase 에서 0032_investor_tappings.sql 실행 여부를 확인해주세요.
        </span>
      </div>
    );
  }

  const rows = (data ?? []) as Row[];

  // 통계
  const total = rows.length;
  const confirmed = rows.filter((r) => r.confirmed_operator).length;
  const inTapping = rows.filter(
    (r) => r.tapping_1 || r.tapping_2 || r.tapping_3 || r.tapping_4 || r.tapping_5,
  ).length;
  const lipsEligible = rows.filter((r) => r.lips_eligible === "여").length;
  const tipsEligible = rows.filter((r) => r.tips_eligible === "여").length;

  return (
    <>
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <MiniStat label="전체" value={total} suffix="곳" />
        <MiniStat label="운영사 확정" value={confirmed} suffix="곳" tint="#10B981" />
        <MiniStat label="태핑 진행" value={inTapping} suffix="곳" tint="#8B5CF6" />
        <MiniStat label="LIPS 대상" value={lipsEligible} suffix="곳" tint="#3B82F6" />
        <MiniStat label="TIPS 대상" value={tipsEligible} suffix="곳" tint="#F59E0B" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px] text-zinc-500">
          셀 클릭 → 인라인 편집 · 자격 배지 클릭 → 여/부/대기중 전환
        </div>
        <AddTappingButton />
      </div>

      {/* 표 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-auto max-h-[calc(100vh-14rem)]">
        <table className="w-full text-[12.5px]" style={{ minWidth: 1500 }}>
          <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(228_228_231)]">
            <tr>
              <Th w={40}>#</Th>
              <Th w={140} sticky>기업명</Th>
              <Th w={80} right>직전매출(억)</Th>
              <Th w={60} right>직원수</Th>
              <Th w={110}>설립일</Th>
              <Th w={80} center>개투조합</Th>
              <Th w={70} center>LIPS</Th>
              <Th w={70} center>TIPS</Th>
              <Th w={90}>진행여부</Th>
              <Th w={120}>확정 운영사</Th>
              <Th w={110}>1차 태핑</Th>
              <Th w={110}>2차 태핑</Th>
              <Th w={110}>3차 태핑</Th>
              <Th w={110}>4차 태핑</Th>
              <Th w={110}>5차 태핑</Th>
              <Th w={40}></Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-10 text-center text-zinc-400 text-[13px]">
                  아직 태핑 데이터가 없습니다. 우측 상단 [+ 신규 추가] 로 시작하세요.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50/40">
                  <td className="px-2 py-1.5 text-center text-[11.5px] text-zinc-400 tabular-nums">
                    {r.seq ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 sticky left-0 bg-white/95 backdrop-blur-sm">
                    {r.company_id ? (
                      <Link
                        href={`/admin/companies/${r.company_id}`}
                        className="text-[13px] font-medium text-zinc-900 hover:text-brand hover:underline"
                      >
                        {r.company_name_snapshot}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-medium text-zinc-900" title="기업 파이프라인에 미매칭">
                        {r.company_name_snapshot}
                        <span className="ml-1 text-[10px] text-amber-500">⚠</span>
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="prev_revenue" initial={r.prev_revenue} align="right" /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="headcount" initial={r.headcount} align="right" /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="established_at" initial={r.established_at} /></td>
                  <td className="px-1 py-1"><EligibleCell id={r.id} field="personal_fund_eligible" initial={r.personal_fund_eligible} /></td>
                  <td className="px-1 py-1"><EligibleCell id={r.id} field="lips_eligible" initial={r.lips_eligible} /></td>
                  <td className="px-1 py-1"><EligibleCell id={r.id} field="tips_eligible" initial={r.tips_eligible} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="progress_status" initial={r.progress_status} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="confirmed_operator" initial={r.confirmed_operator} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="tapping_1" initial={r.tapping_1} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="tapping_2" initial={r.tapping_2} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="tapping_3" initial={r.tapping_3} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="tapping_4" initial={r.tapping_4} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="tapping_5" initial={r.tapping_5} /></td>
                  <td className="px-1 py-1 text-center">
                    <DeleteRowButton id={r.id} name={r.company_name_snapshot} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({
  children,
  w,
  center,
  right,
  sticky,
}: {
  children?: React.ReactNode;
  w?: number;
  center?: boolean;
  right?: boolean;
  sticky?: boolean;
}) {
  return (
    <th
      className={`font-medium px-2 py-2 whitespace-nowrap ${center ? "text-center" : right ? "text-right" : "text-left"} ${sticky ? "sticky left-0 bg-zinc-50 z-20" : ""}`}
      style={{ width: w, minWidth: w }}
    >
      {children}
    </th>
  );
}

function MiniStat({
  label,
  value,
  suffix,
  tint,
}: {
  label: string;
  value: number;
  suffix?: string;
  tint?: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
      <div className="text-[10.5px] font-medium text-zinc-500 uppercase mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-[22px] font-bold tabular-nums leading-none"
          style={{ color: tint ?? "#1F2A36" }}
        >
          {value}
        </span>
        {suffix ? <span className="text-[11.5px] text-zinc-500">{suffix}</span> : null}
      </div>
    </div>
  );
}
