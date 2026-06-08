"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateTipsOperatorMatchAction } from "./actions";

type Operator = {
  id: string;
  name: string;
  assigned_pm: string | null;
  focus_area: string | null;
};

export function TipsOperatorMatch({
  companyId,
  currentId,
  operators,
}: {
  companyId: number;
  currentId: string | null;
  operators: Operator[];
}) {
  const [value, setValue] = useState<string>(currentId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const onChange = (v: string) => {
    setValue(v);
    setError(null);
    startTransition(async () => {
      const r = await updateTipsOperatorMatchAction(companyId, v || null);
      if (r.error) {
        setError(r.error);
        setValue(currentId ?? ""); // 실패 시 원복
      } else {
        setSavedAt(Date.now());
      }
    });
  };

  const matched = operators.find((o) => o.id === value);

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={pending}
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white disabled:opacity-50"
        >
          <option value="">— 매칭 안 됨 —</option>
          {operators.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.focus_area ? ` (${o.focus_area})` : ""}
            </option>
          ))}
        </select>
        {pending ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : null}
      </div>
      {matched ? (
        <div className="text-xs text-zinc-500 mt-1.5">
          담당 심사역: <span className="text-zinc-700 font-medium">{matched.assigned_pm ?? "—"}</span>
          {matched.focus_area ? <span className="text-zinc-400"> · {matched.focus_area}</span> : null}
        </div>
      ) : null}
      {error ? (
        <div className="text-xs text-rose-700 mt-1.5">{error}</div>
      ) : null}
      {!error && savedAt && !pending ? (
        <div className="text-xs text-green-700 mt-1.5">✓ 저장됨</div>
      ) : null}
    </div>
  );
}
