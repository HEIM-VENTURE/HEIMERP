import { createClient } from "@/lib/supabase/server";
import { CompaniesTable, type CompanyRow } from "./table";

export const metadata = { title: "기업 마스터 · HEIM ERP" };
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, ceo_name, founded_at, sales_stage, consulting_stage, source, notes, received_at, consultant_id, program_grade",
    )
    .order("received_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return (
      <div className="text-sm text-rose-600">
        기업 목록 조회 실패: {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as CompanyRow[];
  const total = rows.length;
  const kickoffCount = rows.filter((r) => r.sales_stage === "kickoff").length;
  const sourceCount = rows.filter((r) => r.source === "paid_customers").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-y-3 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">기업 마스터</h1>
          <p className="text-[12px] sm:text-sm text-zinc-500 mt-1">
            전체 기업 데이터베이스. 검색·필터로 찾고 행을 클릭해 상세로 이동합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] shrink-0">
          <Stat label="전체" value={total} />
          <Stat label="착수 단계" value={kickoffCount} color="#B91C42" />
          <Stat label="고객 현황표 시드" value={sourceCount} color="#237A4E" />
        </div>
      </div>

      <CompaniesTable rows={rows} />
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-[14px]" style={{ color: color ?? "#1F2937" }}>
        {value}
      </span>
    </div>
  );
}
