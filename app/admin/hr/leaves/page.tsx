import { createClient } from "@/lib/supabase/server";
import { CalendarCheck2 } from "lucide-react";
import { NewLeaveForm } from "./new-leave-form";
import { LeaveList, type LeaveRow } from "./leave-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "연차 · HEIM ERP" };

export default async function LeavesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: leaves }] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("id, name, email, annual_leave_days, hired_at")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("leave_requests")
      .select("id, user_id, leave_type, start_date, end_date, days, reason, status, decided_by, decided_at, decision_note, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // 신청자 프로필 매핑
  const userIds = Array.from(new Set((leaves ?? []).flatMap((l) => [l.user_id, l.decided_by].filter(Boolean) as string[])));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, name, email").in("id", userIds)
    : { data: [] as { id: string; name: string | null; email: string }[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows: LeaveRow[] = (leaves ?? []).map((l) => ({
    ...l,
    user_name: profileMap.get(l.user_id)?.name || profileMap.get(l.user_id)?.email || "—",
    decided_by_name: l.decided_by
      ? profileMap.get(l.decided_by)?.name || profileMap.get(l.decided_by)?.email || null
      : null,
  }));

  // 올해 사용·잔여 계산 (내 것)
  const thisYear = new Date().getFullYear();
  const myRows = rows.filter((r) => r.user_id === user?.id);
  const usedThisYear = myRows
    .filter((r) => r.status === "approved" && new Date(r.start_date).getFullYear() === thisYear)
    .reduce((s, r) => s + Number(r.days ?? 0), 0);
  const annual = Number(me?.annual_leave_days ?? 15);
  const remaining = annual - usedThisYear;
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <>
      {/* 상단 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label={`${thisYear} 연간 연차`} value={annual.toString()} suffix="일" />
        <Kpi label="사용" value={usedThisYear.toString()} suffix="일" tint="#8B5CF6" />
        <Kpi label="잔여" value={remaining.toFixed(1).replace(/\.0$/, "")} suffix="일" tint="#10B981" />
        <Kpi label="승인 대기" value={pendingCount.toString()} suffix="건" tint="#F59E0B" />
      </div>

      {/* 2열: 왼쪽 신청 폼 · 오른쪽 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck2 className="w-4 h-4 text-brand" />
              <h2 className="text-[14px] font-semibold text-zinc-900">새 연차 신청</h2>
            </div>
            <NewLeaveForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          <LeaveList rows={rows} currentUserId={user?.id ?? null} />
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, suffix, tint }: { label: string; value: string; suffix?: string; tint?: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
      <div className="text-[10.5px] font-medium text-zinc-500 uppercase mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color: tint ?? "#1F2A36" }}>
          {value}
        </span>
        {suffix ? <span className="text-[11.5px] text-zinc-500">{suffix}</span> : null}
      </div>
    </div>
  );
}
