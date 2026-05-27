import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HVP_APPLICATION_STATUS_LABELS } from "@/lib/labels";
import { ApproveButtons } from "./approve-buttons";

export const dynamic = "force-dynamic";

type SearchParams = { status?: "new" | "reviewing" | "approved" | "rejected" | "all" };

const STATUS_COLORS: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  reviewing: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-zinc-100 text-zinc-600",
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filter = sp.status ?? "new";

  const supabase = await createClient();

  let query = supabase
    .from("hvp_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query;
  const list = data ?? [];

  // 카운트 (필터 무관 전체)
  const { data: counts } = await supabase.from("hvp_applications").select("status");
  const all = counts ?? [];
  const stats = {
    new: all.filter((a) => a.status === "new").length,
    reviewing: all.filter((a) => a.status === "reviewing").length,
    approved: all.filter((a) => a.status === "approved").length,
    rejected: all.filter((a) => a.status === "rejected").length,
    all: all.length,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">HVP 신청자 관리</h1>
          <p className="text-sm text-zinc-500 mt-1">
            구글 폼 신청자 검토 · 승인 시 HVP 계정 자동 생성
          </p>
        </div>
      </div>

      {/* 필터 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <FilterCard active={filter === "new"} href="?status=new" label="신규" count={stats.new} tone="amber" />
        <FilterCard active={filter === "reviewing"} href="?status=reviewing" label="검토 중" count={stats.reviewing} tone="blue" />
        <FilterCard active={filter === "approved"} href="?status=approved" label="승인" count={stats.approved} tone="emerald" />
        <FilterCard active={filter === "rejected"} href="?status=rejected" label="거절" count={stats.rejected} tone="zinc" />
        <FilterCard active={filter === "all"} href="?status=all" label="전체" count={stats.all} tone="zinc" />
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      {/* 테이블 */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            {filter === "new"
              ? "신규 신청자가 없습니다 ✨"
              : `${HVP_APPLICATION_STATUS_LABELS[filter as keyof typeof HVP_APPLICATION_STATUS_LABELS] ?? "이"} 상태의 신청자가 없습니다`}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">이름·소속</th>
                <th className="text-left px-4 py-3 font-medium w-36">연락처·이메일</th>
                <th className="text-left px-4 py-3 font-medium w-20">기수</th>
                <th className="text-left px-4 py-3 font-medium w-24">유입경로</th>
                <th className="text-left px-4 py-3 font-medium w-20">추천인</th>
                <th className="text-left px-4 py-3 font-medium w-24">상태</th>
                <th className="text-left px-4 py-3 font-medium w-24">신청일</th>
                <th className="text-left px-4 py-3 font-medium w-64">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{a.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{a.organization ?? "—"}</div>
                    {a.motivation ? (
                      <div className="text-xs text-zinc-500 mt-1.5 line-clamp-2 max-w-xs">
                        💬 {a.motivation}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="text-zinc-700">{a.phone ?? "—"}</div>
                    <div className="text-zinc-500 mt-0.5">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{a.cohort ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-700">{a.channel ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-700">{a.referrer ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_COLORS[a.status]}`}>
                      {HVP_APPLICATION_STATUS_LABELS[a.status as keyof typeof HVP_APPLICATION_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {a.created_at?.split("T")[0]}
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "new" || a.status === "reviewing" ? (
                      <ApproveButtons applicationId={a.id} applicantName={a.name} />
                    ) : a.status === "approved" ? (
                      <span className="text-xs text-emerald-700">✓ 승인 완료</span>
                    ) : (
                      <span className="text-xs text-zinc-400">거절됨</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 "승인 + 계정 생성" 클릭 시: HVP 등록 → Auth 계정 생성 → 임시 비밀번호 표시. 그 비밀번호를 HVP에게 전달하시면 됩니다.
      </div>
    </>
  );
}

function FilterCard({
  active,
  href,
  label,
  count,
  tone,
}: {
  active: boolean;
  href: string;
  label: string;
  count: number;
  tone: "amber" | "blue" | "emerald" | "zinc";
}) {
  const tones = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    zinc: "text-zinc-900",
  };
  return (
    <Link
      href={href}
      className={`block bg-white rounded-xl p-4 transition border ${
        active ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200 hover:border-zinc-400"
      }`}
    >
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${tones[tone]}`}>{count}</div>
    </Link>
  );
}
