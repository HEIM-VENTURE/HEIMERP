"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberHr } from "../actions";

export type MemberRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  hired_at: string | null;
  annual_leave_days: number;
  employment_status: "active" | "on_leave" | "resigned";
  used_this_year: number;
};

const STATUS_LABEL: Record<MemberRow["employment_status"], string> = {
  active: "재직",
  on_leave: "휴직",
  resigned: "퇴사",
};
const STATUS_STYLE: Record<MemberRow["employment_status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  on_leave: "bg-amber-100 text-amber-700",
  resigned: "bg-zinc-100 text-zinc-500",
};

export function MembersTable({ rows }: { rows: MemberRow[] }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-auto">
      <table className="w-full text-[12.5px]">
        <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th className="text-left px-3 py-2 font-medium" style={{ minWidth: 140 }}>이름</th>
            <th className="text-left px-3 py-2 font-medium" style={{ minWidth: 180 }}>이메일</th>
            <th className="text-left px-3 py-2 font-medium" style={{ width: 110 }}>입사일</th>
            <th className="text-right px-3 py-2 font-medium" style={{ width: 100 }}>연간 연차</th>
            <th className="text-right px-3 py-2 font-medium" style={{ width: 90 }}>올해 사용</th>
            <th className="text-right px-3 py-2 font-medium" style={{ width: 90 }}>잔여</th>
            <th className="text-center px-3 py-2 font-medium" style={{ width: 100 }}>상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-zinc-400">
                아직 멤버가 없습니다
              </td>
            </tr>
          ) : (
            rows.map((r) => <MemberRowView key={r.id} r={r} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function MemberRowView({ r }: { r: MemberRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [hired, setHired] = useState(r.hired_at ?? "");
  const [annual, setAnnual] = useState(r.annual_leave_days);
  const [status, setStatus] = useState(r.employment_status);

  const save = (patch: Parameters<typeof updateMemberHr>[1]) => {
    start(async () => {
      const res = await updateMemberHr(r.id, patch);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  const remaining = annual - r.used_this_year;

  return (
    <tr className="border-b border-zinc-100 hover:bg-zinc-50/40">
      <td className="px-3 py-2 text-zinc-900 font-medium">{r.name || "—"}</td>
      <td className="px-3 py-2 text-zinc-600 text-[12px]">{r.email}</td>
      <td className="px-2 py-1">
        <input
          type="date"
          value={hired}
          onChange={(e) => setHired(e.target.value)}
          onBlur={() => (hired || null) !== r.hired_at && save({ hired_at: hired || null })}
          disabled={pending}
          className="w-full h-7 px-2 rounded border border-zinc-200 text-[12px] bg-white"
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="number"
          step="0.5"
          min={0}
          value={annual}
          onChange={(e) => setAnnual(Number(e.target.value))}
          onBlur={() => annual !== r.annual_leave_days && save({ annual_leave_days: annual })}
          disabled={pending}
          className="w-full h-7 px-2 rounded border border-zinc-200 text-[12px] text-right tabular-nums bg-white"
        />
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-zinc-700">
        {r.used_this_year.toFixed(1).replace(/\.0$/, "")}
      </td>
      <td className={`px-3 py-2 text-right tabular-nums font-semibold ${remaining < 0 ? "text-rose-600" : "text-emerald-700"}`}>
        {remaining.toFixed(1).replace(/\.0$/, "")}
      </td>
      <td className="px-2 py-1 text-center">
        <select
          value={status}
          onChange={(e) => {
            const next = e.target.value as MemberRow["employment_status"];
            setStatus(next);
            save({ employment_status: next });
          }}
          disabled={pending}
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full appearance-none cursor-pointer ${STATUS_STYLE[status]}`}
        >
          <option value="active">재직</option>
          <option value="on_leave">휴직</option>
          <option value="resigned">퇴사</option>
        </select>
      </td>
    </tr>
  );
}
