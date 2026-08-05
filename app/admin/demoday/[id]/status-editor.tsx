"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { RoundStatus } from "@/lib/demoday/types";

const STATUS_OPTIONS: { key: RoundStatus; label: string }[] = [
  { key: "draft", label: "준비 중" },
  { key: "scheduled", label: "예정" },
  { key: "live", label: "진행 중" },
  { key: "completed", label: "완료" },
];

export function StatusEditor({
  roundId,
  current,
}: {
  roundId: string;
  current: RoundStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<RoundStatus>(current);
  const [saving, setSaving] = useState(false);

  const change = async (next: RoundStatus) => {
    if (next === value) return;
    setSaving(true);
    setValue(next);
    try {
      const res = await fetch(`/api/admin/demoday/rounds/${roundId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("실패");
      router.refresh();
    } catch {
      setValue(current);
      alert("상태 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={value}
        disabled={saving}
        onChange={(e) => change(e.target.value as RoundStatus)}
        className="h-7 px-2 pr-6 rounded border border-zinc-200 text-[11.5px] font-medium bg-white focus:outline-none focus:border-brand"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      {saving ? <Loader2 className="w-3 h-3 animate-spin text-zinc-400" /> : null}
    </div>
  );
}
