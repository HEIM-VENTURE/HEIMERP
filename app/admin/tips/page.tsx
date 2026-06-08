import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewOperatorModal, EditOperatorRow } from "./operator-modals";
import { MatchedCompanies } from "./matched-companies";

export const dynamic = "force-dynamic";

type Operator = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  focus_area: string | null;
  assigned_pm: string | null;
  last_meeting_at: string | null;
  notes: string | null;
};

export default async function TipsOperatorsPage() {
  const supabase = await createClient();

  const [opRes, matchRes] = await Promise.all([
    supabase
      .from("tips_operators")
      .select(
        "id, name, phone, email, contact_person, focus_area, assigned_pm, last_meeting_at, notes"
      )
      .order("name", { ascending: true }),
    supabase
      .from("company_tips_matches")
      .select("id, tips_operator_id, valuation, investment, program, companies(id, name)"),
  ]);

  const { data, error } = opRes;
  const list = (data as Operator[]) ?? [];
  type MatchRow = {
    id: number;
    tips_operator_id: string;
    valuation: number | null;
    investment: number | null;
    program: "TIPS" | "LIPS";
    companies: { id: number; name: string } | null;
  };
  const matches = (matchRes.data as unknown as MatchRow[]) ?? [];
  type MatchedCo = {
    id: number;
    name: string;
    valuation: number | null;
    investment: number | null;
    program: "TIPS" | "LIPS";
  };
  const matchedByOp = new Map<string, MatchedCo[]>();
  for (const m of matches) {
    if (!m.companies) continue;
    const arr = matchedByOp.get(m.tips_operator_id) ?? [];
    arr.push({
      id: m.companies.id,
      name: m.companies.name,
      valuation: m.valuation,
      investment: m.investment,
      program: m.program ?? "TIPS",
    });
    matchedByOp.set(m.tips_operator_id, arr);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">TIPS 운영사</h1>
          <p className="text-sm text-zinc-500 mt-1">
            전체 {list.length}곳 · 매칭·미팅 이력 관리
          </p>
        </div>
        <NewOperatorModal />
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-900 mb-4">
          {error.message}
          {error.message.includes("assigned_pm") || error.message.includes("last_meeting_at") ? (
            <div className="text-xs mt-1">
              ※ 0022 마이그레이션(컬럼 추가)을 Supabase SQL Editor에서 실행했는지 확인하세요.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-sm text-zinc-500 mb-1">아직 등록된 TIPS 운영사가 없습니다</div>
            <div className="text-xs text-zinc-400">
              우측 상단 &quot;+ 운영사 추가&quot;로 등록하거나, 0022 마이그레이션 실행으로 일괄 import
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50/80 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium">운영사명</th>
                <th className="text-left px-5 py-3.5 font-medium w-28">담당 심사역</th>
                <th className="text-left px-5 py-3.5 font-medium w-40">관심 분야</th>
                <th className="text-left px-5 py-3.5 font-medium w-36">미팅 이력</th>
                <th className="text-left px-5 py-3.5 font-medium w-64">매칭 기업</th>
                <th className="text-left px-5 py-3.5 font-medium">메모</th>
                <th className="text-left px-5 py-3.5 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-zinc-900">{o.name}</td>
                  <td className="px-5 py-3.5">
                    {o.assigned_pm ? (
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {o.assigned_pm.slice(0, 1)}
                        </span>
                        <span className="text-xs text-zinc-700 truncate">{o.assigned_pm}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-600">
                    {o.focus_area ? (
                      <div className="flex flex-wrap gap-1">
                        {o.focus_area.split(/,\s*/).map((tag, i) => (
                          <span
                            key={i}
                            className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {o.last_meeting_at ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-md bg-zinc-100 text-xs text-zinc-600">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {o.last_meeting_at}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 align-top">
                    <MatchedCompanies items={matchedByOp.get(o.id) ?? []} />
                  </td>
                  <td
                    className="px-5 py-3.5 text-xs text-zinc-500 truncate max-w-[260px]"
                    title={o.notes ?? ""}
                  >
                    {o.notes ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <EditOperatorRow operator={o} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 컨설팅 단계 &quot;TIPS 운영사 IR&quot;에 진입하면 여기 등록된 운영사를 매칭에 활용합니다 ·
        담당 심사역(HEIM PM)별 필터는 추후 추가 예정
      </div>
    </>
  );
}
