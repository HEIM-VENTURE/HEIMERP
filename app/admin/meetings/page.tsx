import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Meeting = {
  id: number;
  company_id: number;
  meeting_date: string;
  title: string | null;
  sequence: string | null;
  attendees: string | null;
  ai_summary: string | null;
  companies: { id: number; name: string } | null;
};

export default async function MeetingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .select("id, company_id, meeting_date, title, sequence, attendees, ai_summary, companies(id, name)")
    .order("meeting_date", { ascending: false })
    .limit(50);

  const list = (data as unknown as Meeting[]) ?? [];

  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-zinc-900">미팅 · 회의록</h1>
        <p className="text-sm text-zinc-500 mt-1">최근 회의록 50건 · 자세히 보려면 기업 클릭</p>
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-12 text-sm text-zinc-400">아직 등록된 회의록이 없습니다</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50/80 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium w-36">날짜</th>
                <th className="text-left px-5 py-3.5 font-medium">제목</th>
                <th className="text-left px-5 py-3.5 font-medium w-40">기업</th>
                <th className="text-left px-5 py-3.5 font-medium w-24">차수</th>
                <th className="text-left px-5 py-3.5 font-medium w-20">AI 요약</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 text-xs text-zinc-600">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {m.meeting_date}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-zinc-900 truncate max-w-md" title={m.title ?? ""}>
                      {m.title ?? <span className="text-zinc-300">제목 없음</span>}
                    </div>
                    {m.attendees ? (
                      <div className="text-xs text-zinc-400 truncate max-w-md mt-0.5" title={m.attendees}>
                        참석: {m.attendees}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {m.companies ? (
                      <Link
                        href={`/admin/companies/${m.companies.id}`}
                        className="text-zinc-700 hover:text-brand hover:underline"
                      >
                        {m.companies.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-600">
                    {m.sequence ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {m.ai_summary ? (
                      <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
                        ✨ 있음
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 회의록 작성·수정은 기업 상세 페이지에서 가능합니다
      </div>
    </>
  );
}
