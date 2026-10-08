"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { decideLeaveRequest, cancelLeaveRequest, type LeaveStatus, type LeaveType } from "../actions";

export type LeaveRow = {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  user_name: string;
  decided_by_name: string | null;
};

const TYPE_LABEL: Record<LeaveType, string> = {
  annual: "연차",
  half_am: "오전반차",
  half_pm: "오후반차",
  sick: "병가",
  official: "공가",
  other: "기타",
};

const STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
  cancelled: "취소",
};

const STATUS_STYLE: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

const TABS: { key: "pending" | "all" | "mine"; label: string }[] = [
  { key: "pending", label: "승인 대기" },
  { key: "all", label: "전체" },
  { key: "mine", label: "내 신청" },
];

export function LeaveList({
  rows,
  currentUserId,
}: {
  rows: LeaveRow[];
  currentUserId: string | null;
}) {
  const [tab, setTab] = useState<"pending" | "all" | "mine">("pending");
  const filtered = rows.filter((r) => {
    if (tab === "pending") return r.status === "pending";
    if (tab === "mine") return r.user_id === currentUserId;
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 border-b border-zinc-200">
        {TABS.map((t) => {
          const count = t.key === "pending"
            ? rows.filter((r) => r.status === "pending").length
            : t.key === "mine"
            ? rows.filter((r) => r.user_id === currentUserId).length
            : rows.length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2.5 text-[13px] -mb-px border-b-2 ${
                active ? "border-brand text-zinc-900 font-medium" : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[11px] text-zinc-400 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl py-12 text-center text-sm text-zinc-400">
          해당하는 신청이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <LeaveCard key={r.id} r={r} isMine={r.user_id === currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaveCard({ r, isMine }: { r: LeaveRow; isMine: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showDecide, setShowDecide] = useState<"approved" | "rejected" | null>(null);
  const [note, setNote] = useState("");

  const decide = (decision: "approved" | "rejected") => {
    start(async () => {
      const res = await decideLeaveRequest(r.id, decision, note);
      if (res.error) {
        alert(res.error);
        return;
      }
      setShowDecide(null);
      setNote("");
      router.refresh();
    });
  };

  const cancel = () => {
    if (!confirm("이 신청을 취소하시겠습니까?")) return;
    start(async () => {
      const res = await cancelLeaveRequest(r.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  const dateRange = r.start_date === r.end_date
    ? r.start_date
    : `${r.start_date} ~ ${r.end_date}`;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${STATUS_STYLE[r.status]}`}>
              {STATUS_LABEL[r.status]}
            </span>
            <span className="text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full">
              {TYPE_LABEL[r.leave_type]}
            </span>
            <span className="text-[13.5px] font-semibold text-zinc-900 tabular-nums">
              {dateRange}
            </span>
            <span className="text-[11.5px] text-zinc-500">· {Number(r.days)}일</span>
          </div>
          <div className="text-[12px] text-zinc-600">
            <b className="text-zinc-900">{r.user_name}</b>
            {r.reason ? <span className="ml-2 text-zinc-500">· {r.reason}</span> : null}
          </div>
          {r.status !== "pending" && r.decided_by_name ? (
            <div className="text-[11px] text-zinc-400 mt-1">
              {STATUS_LABEL[r.status]} · {r.decided_by_name}
              {r.decision_note ? ` · ${r.decision_note}` : ""}
            </div>
          ) : null}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {r.status === "pending" && !isMine ? (
            showDecide ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="메모 (선택)"
                  className="h-7 px-2 rounded border border-zinc-300 text-[11.5px] w-32"
                />
                <button
                  type="button"
                  onClick={() => decide(showDecide)}
                  disabled={pending}
                  className={`h-7 px-2.5 rounded text-[11.5px] font-medium text-white ${showDecide === "approved" ? "bg-emerald-600" : "bg-rose-600"} disabled:opacity-50`}
                >
                  확정
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDecide(null); setNote(""); }}
                  disabled={pending}
                  className="h-7 px-2 rounded text-[11.5px] text-zinc-500 hover:text-zinc-900"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowDecide("approved")}
                  disabled={pending}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11.5px] font-medium hover:bg-emerald-100"
                >
                  <Check className="w-3 h-3" /> 승인
                </button>
                <button
                  type="button"
                  onClick={() => setShowDecide("rejected")}
                  disabled={pending}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-rose-200 bg-rose-50 text-rose-700 text-[11.5px] font-medium hover:bg-rose-100"
                >
                  <X className="w-3 h-3" /> 반려
                </button>
              </>
            )
          ) : null}

          {isMine && r.status === "pending" ? (
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded text-[11.5px] text-zinc-500 hover:text-rose-600"
            >
              <Trash2 className="w-3 h-3" /> 취소
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
