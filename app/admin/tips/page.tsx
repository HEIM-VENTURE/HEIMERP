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
  notes: string | null;
};

export default async function TipsOperatorsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tips_operators")
    .select("id, name, phone, email, contact_person, focus_area, notes")
    .order("name", { ascending: true });

  const list = (data as Operator[]) ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">TIPS 운영사</h1>
          <p className="text-sm text-zinc-500 mt-1">
            전체 {list.length}곳 · 매칭·연락처 관리
          </p>
        </div>
        <NewOperatorModal />
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-sm text-zinc-500 mb-1">아직 등록된 TIPS 운영사가 없습니다</div>
            <div className="text-xs text-zinc-400">우측 상단 "+ 운영사 추가"로 등록하세요</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50/80 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium">기관명</th>
                <th className="text-left px-5 py-3.5 font-medium w-36">담당자</th>
                <th className="text-left px-5 py-3.5 font-medium w-36">연락처</th>
                <th className="text-left px-5 py-3.5 font-medium w-48">이메일</th>
                <th className="text-left px-5 py-3.5 font-medium w-32">분야</th>
                <th className="text-left px-5 py-3.5 font-medium">메모</th>
                <th className="text-left px-5 py-3.5 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-zinc-900">{o.name}</td>
                  <td className="px-5 py-3.5 text-zinc-700">
                    {o.contact_person ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-700">
                    {o.phone ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-700">
                    {o.email ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-600">
                    {o.focus_area ?? <span className="text-zinc-300">—</span>}
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
        💡 컨설팅 단계 "TIPS 운영사 IR"에 진입하면 여기 등록된 운영사를 매칭에 활용합니다
      </div>
    </>
  );
}
