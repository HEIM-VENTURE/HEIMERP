import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewOperatorModal, EditOperatorRow } from "./operator-modals";

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
      .from("companies")
      .select("id, name, tips_operator_id, tips_match_valuation, tips_match_investment")
      .not("tips_operator_id", "is", null)
      .order("name", { ascending: true }),
  ]);

  const { data, error } = opRes;
  const list = (data as Operator[]) ?? [];
  type MatchedCo = {
    id: number;
    name: string;
    tips_operator_id: string | null;
    tips_match_valuation: number | null;
    tips_match_investment: number | null;
  };
  const matches = (matchRes.data as MatchedCo[]) ?? [];
  const matchedByOp = new Map<string, MatchedCo[]>();
  for (const m of matches) {
    if (!m.tips_operator_id) continue;
    const arr = matchedByOp.get(m.tips_operator_id) ?? [];
    arr.push(m);
    matchedByOp.set(m.tips_operator_id, arr);
  }

  const fmtEok = (mil: number | null) => {
    if (mil == null) return null;
    const e = mil / 100;
    return Number.isInteger(e) ? `${e}억` : `${e.toFixed(1).replace(/\.0$/, "")}억`;
  };

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
                    {(matchedByOp.get(o.id)?.length ?? 0) > 0 ? (
                      <div className="space-y-1.5">
                        <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700">
                          {matchedByOp.get(o.id)?.length}곳 매칭
                        </span>
                        <div className="space-y-0.5">
                          {matchedByOp.get(o.id)?.map((c) => {
                            const val = fmtEok(c.tips_match_valuation);
                            const inv = fmtEok(c.tips_match_investment);
                            const cond =
                              val && inv
                                ? `${val} 밸류 / ${inv} 투자`
                                : val
                                  ? `${val} 밸류`
                                  : inv
                                    ? `${inv} 투자`
                                    : "";
                            return (
                              <div key={c.id} className="text-xs">
                                <Link
                                  href={`/admin/companies/${c.id}`}
                                  className="text-zinc-700 hover:text-brand hover:underline font-medium"
                                >
                                  {c.name}
                                </Link>
                                {cond ? (
                                  <span className="text-zinc-400 ml-1.5">· {cond}</span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
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
