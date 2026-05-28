import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CONTRACT_PAYMENT_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

type Contract = {
  id: number;
  company_id: number;
  contracted_at: string;
  total_amount: number;
  hvp_fee_rate: number;
  hvp_fee_amount: number;
  payment_status: "scheduled" | "paid";
  paid_at: string | null;
  companies: { id: number; name: string } | null;
};

export default async function HvpFeesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("hvp_id, name")
    .eq("id", user.id)
    .single();

  const myHvpId = profile?.hvp_id;

  if (!myHvpId) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">수수료 내역</h1>
        <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          HVP 정보가 연결되지 않았습니다. 관리자에게 문의하세요.
        </div>
      </div>
    );
  }

  const { data: hvp } = await supabase
    .from("hvp")
    .select("name, cohort, default_fee_rate")
    .eq("id", myHvpId)
    .single();

  const { data: contractsData } = await supabase
    .from("contracts")
    .select(
      "id, company_id, contracted_at, total_amount, hvp_fee_rate, hvp_fee_amount, payment_status, paid_at, companies(id, name)"
    )
    .eq("hvp_id", myHvpId)
    .order("contracted_at", { ascending: false });

  const contracts = (contractsData as unknown as Contract[]) ?? [];

  // 합계
  const totalFee = contracts.reduce((s, c) => s + Number(c.hvp_fee_amount ?? 0), 0);
  const paidFee = contracts
    .filter((c) => c.payment_status === "paid")
    .reduce((s, c) => s + Number(c.hvp_fee_amount ?? 0), 0);
  const scheduledFee = totalFee - paidFee;
  const paidCount = contracts.filter((c) => c.payment_status === "paid").length;
  const scheduledCount = contracts.length - paidCount;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">수수료 내역</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {hvp?.name ?? profile?.name}님 · 기본 수수료율 {((hvp?.default_fee_rate ?? 0.2) * 100).toFixed(0)}%
        </p>
      </div>

      {/* 합계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs text-zinc-500">누적 수수료</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">
            {Math.round(totalFee).toLocaleString()}
            <span className="text-sm font-medium text-zinc-500">만원</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">전체 {contracts.length}건</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs text-zinc-500">지급 완료</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {Math.round(paidFee).toLocaleString()}
            <span className="text-sm font-medium text-zinc-500">만원</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">{paidCount}건 정산 완료</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs text-zinc-500">지급 예정</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {Math.round(scheduledFee).toLocaleString()}
            <span className="text-sm font-medium text-zinc-500">만원</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">{scheduledCount}건 대기</div>
        </div>
      </div>

      {/* 계약별 표 */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">계약별 수수료</h2>
        </div>
        {contracts.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            아직 계약된 기업이 없습니다. 기업이 &quot;계약&quot; 단계에 진입하면 표시됩니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium">기업</th>
                <th className="text-left px-6 py-3 font-medium w-28">계약일</th>
                <th className="text-right px-6 py-3 font-medium w-28">컨설팅 금액</th>
                <th className="text-right px-6 py-3 font-medium w-20">수수료율</th>
                <th className="text-right px-6 py-3 font-medium w-28">내 수수료</th>
                <th className="text-left px-6 py-3 font-medium w-32">지급 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-3.5">
                    {c.companies ? (
                      <Link
                        href={`/hvp/companies/${c.companies.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {c.companies.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-zinc-600">{c.contracted_at}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-zinc-700">
                    {Number(c.total_amount).toLocaleString()}만
                  </td>
                  <td className="px-6 py-3.5 text-right text-xs text-zinc-500 tabular-nums">
                    {(Number(c.hvp_fee_rate) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums font-semibold text-zinc-900">
                    {Math.round(Number(c.hvp_fee_amount ?? 0)).toLocaleString()}만
                  </td>
                  <td className="px-6 py-3.5">
                    {c.payment_status === "paid" ? (
                      <div>
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">
                          ✓ {CONTRACT_PAYMENT_LABELS.paid}
                        </span>
                        {c.paid_at ? (
                          <div className="text-[10px] text-zinc-400 mt-0.5">{c.paid_at}</div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700">
                        ● {CONTRACT_PAYMENT_LABELS.scheduled}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 수수료는 계약 금액 × 수수료율로 자동 계산됩니다. 지급 처리는 관리자가 진행합니다.
      </div>
    </>
  );
}
