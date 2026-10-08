"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLeaveRequest, type LeaveType } from "../actions";

const TYPES: { value: LeaveType; label: string; isHalf: boolean }[] = [
  { value: "annual", label: "연차", isHalf: false },
  { value: "half_am", label: "오전 반차", isHalf: true },
  { value: "half_pm", label: "오후 반차", isHalf: true },
  { value: "sick", label: "병가", isHalf: false },
  { value: "official", label: "공가", isHalf: false },
  { value: "other", label: "기타", isHalf: false },
];

export function NewLeaveForm() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const isHalf = TYPES.find((t) => t.value === type)?.isHalf;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createLeaveRequest({
        leave_type: type,
        start_date: startDate,
        end_date: isHalf ? startDate : endDate,
        reason,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setReason("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-[11px] font-medium text-zinc-500 block mb-1">종류</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as LeaveType)}
          className="w-full h-9 px-3 rounded-md border border-zinc-300 text-[13px] bg-white cursor-pointer"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-medium text-zinc-500 block mb-1">
            {isHalf ? "날짜" : "시작일"}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full h-9 px-2 rounded-md border border-zinc-300 text-[13px] bg-white"
          />
        </div>
        {!isHalf ? (
          <div>
            <label className="text-[11px] font-medium text-zinc-500 block mb-1">종료일</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full h-9 px-2 rounded-md border border-zinc-300 text-[13px] bg-white"
            />
          </div>
        ) : (
          <div className="flex items-end">
            <span className="text-[11px] text-zinc-400 pb-2.5">반차 · 0.5일 처리</span>
          </div>
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium text-zinc-500 block mb-1">사유 (선택)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="예: 개인 사유"
          className="w-full px-3 py-2 rounded-md border border-zinc-300 text-[12.5px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
        />
      </div>

      {error ? <div className="text-[12px] text-rose-600">{error}</div> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-9 rounded-md bg-brand text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {pending ? "신청 중…" : "연차 신청"}
      </button>
    </form>
  );
}
