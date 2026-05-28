import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ApproveButtons } from "./approve-buttons";

export const dynamic = "force-dynamic";

type Stage = "applied" | "paid" | "completed" | "partner" | "rejected";
type SearchParams = { stage?: Stage | "all" };

const STAGE_LABEL: Record<Stage, string> = {
  applied: "신청",
  paid: "결제 완료",
  completed: "교육 이수",
  partner: "파트너 활동",
  rejected: "거절/이탈",
};
const STAGE_COLOR: Record<Stage, string> = {
  applied: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  completed: "bg-violet-100 text-violet-700",
  partner: "bg-emerald-100 text-emerald-700",
  rejected: "bg-zinc-100 text-zinc-500",
};

type App = {
  id: string;
  name: string;
  organization: string | null;
  phone: string | null;
  email: string;
  motivation: string | null;
  channel: string | null;
  cohort: string | null;
  onboarding_stage: Stage | null;
  paid_amount: number | null;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filter = sp.stage ?? "all";

  const supabase = await createClient();

  let listQuery = supabase
    .from("hvp_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter !== "all") listQuery = listQuery.eq("onboarding_stage", filter);

  const [listRes, countsRes] = await Promise.all([
    listQuery,
    supabase.from("hvp_applications").select("onboarding_stage"),
  ]);

  const { data, error } = listRes;
  const list = (data as App[]) ?? [];
  const all = (countsRes.data as { onboarding_stage: Stage | null }[]) ?? [];
  const countOf = (s: Stage) => all.filter((a) => (a.onboarding_stage ?? "applied") === s).length;
  const stats = {
    applied: countOf("applied"),
    paid: countOf("paid"),
    completed: countOf("completed"),
    partner: countOf("partner"),
    rejected: countOf("rejected"),
    all: all.length,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">HVP 신청자 관리</h1>
          <p className="text-sm text-zinc-500 mt-1">
            신청 → 결제(교육비) → 교육 이수 → 파트너 등록 단계로 관리
          </p>
        </div>
      </div>

      {/* 단계 퍼널 */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        <FilterCard active={filter === "applied"} href="?stage=applied" label="신청" count={stats.applied} tone="amber" />
        <FilterCard active={filter === "paid"} href="?stage=paid" label="결제 완료" count={stats.paid} tone="blue" />
        <FilterCard active={filter === "completed"} href="?stage=completed" label="교육 이수" count={stats.completed} tone="violet" />
        <FilterCard active={filter === "partner"} href="?stage=partner" label="파트너" count={stats.partner} tone="emerald" />
        <FilterCard active={filter === "rejected"} href="?stage=rejected" label="거절/이탈" count={stats.rejected} tone="zinc" />
        <FilterCard active={filter === "all"} href="?stage=all" label="전체" count={stats.all} tone="zinc" />
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          {error.message}
          <div className="text-xs mt-1">※ 0018 마이그레이션(onboarding_stage)을 실행했는지 확인하세요.</div>
        </div>
      ) : null}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">해당 단계의 신청자가 없습니다</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">이름·소속</th>
                <th className="text-left px-4 py-3 font-medium w-36">연락처·이메일</th>
                <th className="text-left px-4 py-3 font-medium w-28">단계</th>
                <th className="text-left px-4 py-3 font-medium w-32">결제·이수</th>
                <th className="text-left px-4 py-3 font-medium w-20">신청일</th>
                <th className="text-left px-4 py-3 font-medium w-72">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((a) => {
                const stage = (a.onboarding_stage ?? "applied") as Stage;
                return (
                  <tr key={a.id} className="hover:bg-zinc-50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{a.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{a.organization ?? "—"}</div>
                      {a.motivation ? (
                        <div className="text-xs text-zinc-500 mt-1.5 line-clamp-2 max-w-xs">💬 {a.motivation}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-zinc-700">{a.phone ?? "—"}</div>
                      <div className="text-zinc-500 mt-0.5">{a.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${STAGE_COLOR[stage]}`}>
                        {STAGE_LABEL[stage]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {a.paid_at ? (
                        <div>💳 {a.paid_amount ? `${Number(a.paid_amount).toLocaleString()}만` : ""} · {a.paid_at}</div>
                      ) : null}
                      {a.completed_at ? <div className="mt-0.5">🎓 {a.completed_at}</div> : null}
                      {!a.paid_at && !a.completed_at ? <span className="text-zinc-300">—</span> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{a.created_at?.split("T")[0]}</td>
                    <td className="px-4 py-3">
                      <ApproveButtons applicationId={a.id} applicantName={a.name} stage={stage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 단계: <b>신청</b> → <b>결제 확인</b>(교육비 입력) → <b>교육 이수</b> → <b>파트너 등록</b>.
        파트너 등록 시 HVP 명단에 추가되고, 본인 Google 계정으로 로그인하면 자동 연결됩니다.
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
  tone: "amber" | "blue" | "violet" | "emerald" | "zinc";
}) {
  const tones = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    violet: "text-violet-600",
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
