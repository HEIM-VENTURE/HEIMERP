import { createClient } from "@/lib/supabase/server";
import { PaidCustomerTable } from "./table";

export const metadata = { title: "고객 현황표 · HEIM ERP" };
export const dynamic = "force-dynamic";

type PaidCustomer = {
  id: string;
  no: number | null;
  company_name: string;
  is_paid: boolean | null;
  new_corp_setup: string | null;
  new_company_name: string | null;
  target_program: string | null;
  urgency: number | null;
  legal_name: string | null;
  established_at: string | null;
  headcount: string | null;
  ir_deck_tips: string | null;
  ir_deck_lips: string | null;
  demoday_1_a: string | null;
  demoday_1_b: string | null;
  demoday_2_a: string | null;
  demoday_2_b: string | null;
  offline: string | null;
  memo: string | null;
  company_id: number | null;
  company?: {
    id: number;
    name: string;
    sales_stage: string | null;
    consulting_stage: string | null;
  } | null;
};

export default async function PaidCustomersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paid_customers")
    .select("*, company:companies!paid_customers_company_id_fkey(id, name, sales_stage, consulting_stage)")
    .order("urgency", { ascending: true, nullsFirst: false })
    .order("no", { ascending: true });

  if (error) {
    return (
      <div className="text-sm text-rose-600">
        결제 고객 목록 조회 실패: {error.message}
        <br />
        <span className="text-xs text-zinc-500 mt-2 block">
          Supabase에 0036_paid_customers.sql 마이그레이션을 먼저 실행해주세요.
        </span>
      </div>
    );
  }

  const rows = (data ?? []) as PaidCustomer[];
  const totalCount = rows.length;
  const paidCount = rows.filter((r) => r.is_paid === true).length;
  const urgentCount = rows.filter((r) => r.urgency === 1).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-y-3 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">고객 현황표</h1>
          <p className="text-[12px] sm:text-sm text-zinc-500 mt-1">
            전체 고객 현황을 한 화면에서 관리합니다. 셀을 클릭해 바로 수정하거나 상세를 열어 전체 항목을 편집하세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] shrink-0">
          <StatBadge label="전체" value={totalCount} />
          <StatBadge label="결제 완료" value={paidCount} color="#237A4E" />
          <StatBadge label="긴급도 1" value={urgentCount} color="#C0343A" />
        </div>
      </div>

      <PaidCustomerTable rows={rows} />
    </>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-[14px]" style={{ color: color ?? "#1F2937" }}>
        {value}
      </span>
    </div>
  );
}
