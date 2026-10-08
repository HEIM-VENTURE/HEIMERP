import { createClient } from "@/lib/supabase/server";
import { MembersTable, type MemberRow } from "./members-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "멤버 · HEIM ERP" };

export default async function MembersPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: leaves }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, hired_at, annual_leave_days, employment_status")
      .order("name", { ascending: true }),
    supabase
      .from("leave_requests")
      .select("user_id, days, status, start_date")
      .eq("status", "approved"),
  ]);

  const thisYear = new Date().getFullYear();
  const usedByUser = new Map<string, number>();
  for (const l of leaves ?? []) {
    const y = new Date(l.start_date).getFullYear();
    if (y !== thisYear) continue;
    usedByUser.set(l.user_id, (usedByUser.get(l.user_id) ?? 0) + Number(l.days ?? 0));
  }

  const rows: MemberRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    hired_at: p.hired_at,
    annual_leave_days: Number(p.annual_leave_days ?? 15),
    employment_status: (p.employment_status ?? "active") as "active" | "on_leave" | "resigned",
    used_this_year: usedByUser.get(p.id) ?? 0,
  }));

  return (
    <>
      <div className="mb-4 text-[12px] text-zinc-500">
        입사일·연간 연차·고용 상태는 셀 클릭으로 바로 편집할 수 있습니다. 올해 사용 일수는 승인된 신청만 집계합니다.
      </div>
      <MembersTable rows={rows} />
    </>
  );
}
