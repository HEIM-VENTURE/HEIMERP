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
  body: string | null;
  ai_summary: string | null;
  companies: { id: number; name: string } | null;
};

type SearchParams = { q?: string };

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("meetings")
    .select(
      "id, company_id, meeting_date, title, sequence, attendees, body, ai_summary, companies(id, name)"
    )
    .order("meeting_date", { ascending: false })
    .limit(100);

  if (q) {
    const safe = q.replace(/[%,]/g, "");
    query = query.or(`title.ilike.%${safe}%,attendees.ilike.%${safe}%,body.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  const list = (data as unknown as Meeting[]) ?? [];

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-zinc-900">미팅 · 회의록</h1>
        <p className="text-sm text-zinc-500 mt-1">
          최근 회의록 {list.length}건{q ? ` · "${q}" 검색 결과` : ""}
        </p>
      </div>

      {/* 검색 */}
      <form action="/admin/meetings" method="get" className="bg-white border border-zinc-200 rounded-2xl p-3 mb-3">
        <div className="relative">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="제목·참석자·본문 검색…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
        </div>
      </form>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl text-center py-16">
          <div className="text-sm text-zinc-400">
            {q ? `"${q}"에 해당하는 회의록이 없습니다` : "아직 등록된 회의록이 없습니다"}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <Link
              key={m.id}
              href={`/admin/companies/${m.company_id}`}
              className="block bg-white border border-zinc-200 rounded-2xl p-5 hover:border-brand/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-md bg-zinc-100 text-xs text-zinc-600">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {m.meeting_date}
                  </span>
                  {m.sequence ? (
                    <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium rounded-full bg-brand/10 text-brand">
                      {m.sequence}
                    </span>
                  ) : null}
                  {m.ai_summary ? (
                    <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
                      ✨ AI 요약
                    </span>
                  ) : null}
                </div>
                {m.companies ? (
                  <span className="text-xs text-zinc-500 shrink-0">{m.companies.name}</span>
                ) : null}
              </div>

              <div className="font-medium text-zinc-900 mb-1">
                {m.title ?? <span className="text-zinc-400">제목 없음</span>}
              </div>

              {m.attendees ? (
                <div className="text-xs text-zinc-500 mb-2">참석: {m.attendees}</div>
              ) : null}

              {m.ai_summary ? (
                <div className="text-xs text-amber-900 line-clamp-2 bg-amber-50/60 px-3 py-2 rounded-md">
                  {plainExcerpt(m.ai_summary, 220)}
                </div>
              ) : m.body ? (
                <div className="text-xs text-zinc-600 line-clamp-2">
                  {plainExcerpt(m.body, 220)}
                </div>
              ) : (
                <div className="text-xs text-zinc-300">본문 없음</div>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="text-xs text-zinc-400 mt-4">
        💡 회의록 추가·수정은 각 기업 상세 페이지에서 가능합니다 · 카드 클릭으로 기업 이동
      </div>
    </>
  );
}

function plainExcerpt(text: string, max = 200): string {
  // 마크다운/공백 정리
  const cleaned = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
}
