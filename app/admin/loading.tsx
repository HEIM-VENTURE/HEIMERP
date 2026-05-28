/**
 * Admin 전역 로딩 스켈레톤.
 * Netlify(US) → Supabase(Seoul) 라운드트립 동안 빈 화면 대신 골격을 먼저 표시.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="h-7 w-40 bg-zinc-200 rounded mb-2" />
          <div className="h-4 w-64 bg-zinc-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-zinc-200 rounded-lg" />
          <div className="h-9 w-28 bg-zinc-200 rounded-lg" />
        </div>
      </div>

      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="h-3 w-20 bg-zinc-100 rounded mb-3" />
            <div className="h-7 w-16 bg-zinc-200 rounded mb-2" />
            <div className="h-3 w-24 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>

      {/* 본문 박스 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <div className="h-5 w-32 bg-zinc-200 rounded mb-5" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <div className="h-3 w-20 bg-zinc-100 rounded" />
                  <div className="h-3 w-8 bg-zinc-100 rounded" />
                </div>
                <div className="h-2 bg-zinc-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="h-5 w-32 bg-zinc-200 rounded mb-5" />
          <div className="h-40 bg-zinc-50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
