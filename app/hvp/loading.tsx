/**
 * HVP 전역 로딩 스켈레톤.
 */
export default function HvpLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="h-7 w-56 bg-zinc-200 rounded mb-2" />
          <div className="h-4 w-44 bg-zinc-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-zinc-200 rounded-lg" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="h-3 w-20 bg-zinc-100 rounded mb-3" />
            <div className="h-7 w-16 bg-zinc-200 rounded mb-2" />
            <div className="h-3 w-24 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="h-5 w-32 bg-zinc-200 rounded mb-5" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-zinc-50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
