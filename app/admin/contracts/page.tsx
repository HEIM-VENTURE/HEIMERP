import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewContractModal, EditContractRow } from "./contract-modals";

export const dynamic = "force-dynamic";

type Contract = {
  id: number;
  company_id: number;
  contracted_at: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  companies: { id: number; name: string } | null;
};

export default async function ContractsPage() {
  const supabase = await createClient();

  const [allRes, listRes, companiesRes] = await Promise.all([
    supabase.from("contracts").select("id, total_amount"),
    supabase
      .from("contracts")
      .select("id, company_id, contracted_at, total_amount, notes, created_at, companies(id, name)")
      .order("contracted_at", { ascending: false }),
    supabase
      .from("companies")
      .select("id, name, proposal_amount")
      .order("name", { ascending: true }),
  ]);

  const all = (allRes.data as Pick<Contract, "id" | "total_amount">[]) ?? [];
  const { data, error } = listRes;
  const list = (data as unknown as Contract[]) ?? [];
  const companies = (companiesRes.data as { id: number; name: string; proposal_amount: number | null }[]) ?? [];

  const totalCount = all.length;
  const totalAmount = all.reduce((s, c) => s + Number(c.total_amount ?? 0), 0);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">계약</h1>
          <p className="text-sm text-zinc-500 mt-1">
            전체 {totalCount}건 · 총 {Math.round(totalAmount).toLocaleString()}만원
          </p>
        </div>
        <NewContractModal companies={companies} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Kpi label="총 계약" value={`${totalCount}건`} />
        <Kpi label="계약 금액 총액" value={`${Math.round(totalAmount).toLocaleString()}만원`} />
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 bg-zinc-50/80 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3.5 font-medium">기업</th>
              <th className="text-left px-5 py-3.5 font-medium w-32">계약일</th>
              <th className="text-right px-5 py-3.5 font-medium w-32">총 금액</th>
              <th className="text-left px-5 py-3.5 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  {c.companies ? (
                    <Link
                      href={`/admin/companies/${c.companies.id}`}
                      className="text-zinc-900 hover:text-brand hover:underline font-medium"
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
                <td className="px-5 py-3.5">
                  {c.contracted_at ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-md bg-zinc-100 text-xs text-zinc-600">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {c.contracted_at}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-zinc-900 font-medium">
                  {Number(c.total_amount).toLocaleString()}만
                </td>
                <td className="px-5 py-3.5">
                  <EditContractRow
                    contract={{
                      id: c.id,
                      company_id: c.company_id,
                      contracted_at: c.contracted_at,
                      total_amount: Number(c.total_amount),
                      notes: c.notes,
                    }}
                    companyName={c.companies?.name ?? "—"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            아직 계약이 없습니다 — 단계가 &apos;계약&apos;에 진입하면 자동 생성됩니다
          </div>
        ) : null}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 단계가 <b>계약</b>에 진입하면 자동으로 한 줄 생성됩니다 · 편집/삭제는 우측 &quot;편집&quot; 버튼
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-bold mt-0.5 text-zinc-900">{value}</div>
    </div>
  );
}
