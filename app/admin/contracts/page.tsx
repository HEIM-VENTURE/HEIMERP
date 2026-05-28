import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewContractModal, EditContractRow, PaidToggle } from "./contract-modals";

export const dynamic = "force-dynamic";

type Contract = {
  id: number;
  company_id: number;
  contracted_at: string;
  total_amount: number;
  hvp_id: string | null;
  hvp_fee_rate: number;
  hvp_fee_amount: number;
  payment_status: "scheduled" | "paid";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  companies: { id: number; name: string } | null;
  hvp: { id: string; name: string; cohort: string | null } | null;
};

type SearchParams = {
  payment?: "all" | "scheduled" | "paid";
  hvp?: string;
};

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const payment = sp.payment ?? "all";
  const hvpFilter = sp.hvp ?? "all";

  const supabase = await createClient();

  // 필터된 list 쿼리
  let listQuery = supabase
    .from("contracts")
    .select(
      "id, company_id, contracted_at, total_amount, hvp_id, hvp_fee_rate, hvp_fee_amount, payment_status, paid_at, notes, created_at, companies(id, name), hvp(id, name, cohort)"
    )
    .order("contracted_at", { ascending: false });

  if (payment !== "all") listQuery = listQuery.eq("payment_status", payment);
  if (hvpFilter !== "all") {
    if (hvpFilter === "none") listQuery = listQuery.is("hvp_id", null);
    else listQuery = listQuery.eq("hvp_id", hvpFilter);
  }

  // 4개 쿼리 동시 실행 (RTT 1번)
  const [allRes, listRes, companiesRes, hvpsRes] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, total_amount, hvp_fee_amount, payment_status, hvp_id"),
    listQuery,
    supabase
      .from("companies")
      .select("id, name, hvp_id, proposal_amount")
      .order("name", { ascending: true }),
    supabase.from("hvp").select("id, name, cohort").order("name", { ascending: true }),
  ]);

  const all = (allRes.data as Pick<Contract, "id" | "total_amount" | "hvp_fee_amount" | "payment_status" | "hvp_id">[]) ?? [];
  const { data, error } = listRes;
  const list = (data as unknown as Contract[]) ?? [];
  const companies = (companiesRes.data as { id: number; name: string; hvp_id: string | null; proposal_amount: number | null }[]) ?? [];
  const hvps = (hvpsRes.data as { id: string; name: string; cohort: string | null }[]) ?? [];

  // KPI
  const totalCount = all.length;
  const totalAmount = all.reduce((s, c) => s + Number(c.total_amount ?? 0), 0);
  const totalFee = all.reduce((s, c) => s + Number(c.hvp_fee_amount ?? 0), 0);
  const unpaidContracts = all.filter((c) => c.payment_status === "scheduled");
  const unpaidFee = unpaidContracts.reduce((s, c) => s + Number(c.hvp_fee_amount ?? 0), 0);
  const paidFee = totalFee - unpaidFee;

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">계약 · 수수료</h1>
          <p className="text-sm text-zinc-500 mt-1">
            전체 {totalCount}건 · 미지급 HVP 수수료 {Math.round(unpaidFee).toLocaleString()}만원
          </p>
        </div>
        <NewContractModal companies={companies} hvps={hvps} />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="총 계약" value={`${totalCount}건`} sub={`${Math.round(totalAmount).toLocaleString()}만`} tone="zinc" />
        <Kpi label="HVP 수수료 총액" value={`${Math.round(totalFee).toLocaleString()}만`} sub={`${totalCount > 0 ? Math.round((totalFee / totalAmount) * 100) : 0}% 평균`} tone="blue" />
        <Kpi label="지급 완료" value={`${Math.round(paidFee).toLocaleString()}만`} sub={`${all.length - unpaidContracts.length}건`} tone="emerald" />
        <Kpi label="미지급" value={`${Math.round(unpaidFee).toLocaleString()}만`} sub={`${unpaidContracts.length}건`} tone="amber" />
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs items-center">
        <span className="text-zinc-500 mr-1">지급 상태:</span>
        <FilterPill active={payment === "all"} href={buildHref({ payment: "all", hvp: hvpFilter })} label="전체" />
        <FilterPill active={payment === "scheduled"} href={buildHref({ payment: "scheduled", hvp: hvpFilter })} label="지급 예정" />
        <FilterPill active={payment === "paid"} href={buildHref({ payment: "paid", hvp: hvpFilter })} label="지급 완료" />

        <span className="text-zinc-500 ml-3 mr-1">HVP:</span>
        <FilterPill active={hvpFilter === "all"} href={buildHref({ payment, hvp: "all" })} label="전체" />
        <FilterPill active={hvpFilter === "none"} href={buildHref({ payment, hvp: "none" })} label="미지정" />
        {hvps.map((h) => (
          <FilterPill
            key={h.id}
            active={hvpFilter === h.id}
            href={buildHref({ payment, hvp: h.id })}
            label={h.name}
          />
        ))}
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      {/* 테이블 */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 bg-zinc-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">기업</th>
              <th className="text-left px-4 py-3 font-medium w-28">계약일</th>
              <th className="text-right px-4 py-3 font-medium w-28">총 금액</th>
              <th className="text-left px-4 py-3 font-medium w-40">HVP</th>
              <th className="text-right px-4 py-3 font-medium w-20">수수료율</th>
              <th className="text-right px-4 py-3 font-medium w-28">수수료 금액</th>
              <th className="text-left px-4 py-3 font-medium w-28">지급 상태</th>
              <th className="text-left px-4 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  {c.companies ? (
                    <Link
                      href={`/admin/companies/${c.companies.id}`}
                      className="text-zinc-900 hover:underline font-medium"
                    >
                      {c.companies.name}
                    </Link>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                  {c.notes ? (
                    <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-[280px]" title={c.notes}>
                      {c.notes}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-700">{c.contracted_at}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-900 font-medium">
                  {Number(c.total_amount).toLocaleString()}만
                </td>
                <td className="px-4 py-3 text-xs">
                  {c.hvp ? (
                    <span className="text-zinc-700">
                      {c.hvp.name}
                      {c.hvp.cohort ? <span className="text-zinc-400"> · {c.hvp.cohort}</span> : null}
                    </span>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs text-zinc-500 tabular-nums">
                  {(Number(c.hvp_fee_rate) * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                  {Math.round(Number(c.hvp_fee_amount ?? 0)).toLocaleString()}만
                </td>
                <td className="px-4 py-3">
                  <PaidToggle contractId={c.id} paid={c.payment_status === "paid"} />
                  {c.payment_status === "paid" && c.paid_at ? (
                    <div className="text-[10px] text-zinc-400 mt-0.5">{c.paid_at}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <EditContractRow
                    contract={{
                      id: c.id,
                      company_id: c.company_id,
                      contracted_at: c.contracted_at,
                      total_amount: Number(c.total_amount),
                      hvp_id: c.hvp_id,
                      hvp_fee_rate: Number(c.hvp_fee_rate),
                      payment_status: c.payment_status,
                      notes: c.notes,
                    }}
                    hvps={hvps}
                    companyName={c.companies?.name ?? "—"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            {payment !== "all" || hvpFilter !== "all"
              ? "필터에 맞는 계약이 없습니다"
              : "아직 계약이 없습니다 — 단계가 '계약'에 진입하면 자동 생성됩니다"}
          </div>
        ) : null}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 단계가 <b>계약</b>에 진입하면 자동으로 한 줄 생성되어요 ·
        지급 상태 뱃지 클릭으로 빠른 토글 ·
        편집/삭제는 우측 &quot;편집&quot; 버튼
      </div>
    </>
  );
}

function buildHref({ payment, hvp }: { payment: string; hvp: string }): string {
  const params = new URLSearchParams();
  if (payment !== "all") params.set("payment", payment);
  if (hvp !== "all") params.set("hvp", hvp);
  const s = params.toString();
  return s ? `?${s}` : "?";
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "zinc" | "blue" | "emerald" | "amber";
}) {
  const tones = {
    zinc: "text-zinc-900",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>
    </div>
  );
}

function FilterPill({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full ${
        active ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {label}
    </Link>
  );
}
