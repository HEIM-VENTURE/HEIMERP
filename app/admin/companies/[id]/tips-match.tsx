"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  currentValuation,
  currentInvestment,
  operators,
}: {
  companyId: number;
  currentId: string | null;
  /** DB 백만원 단위 */
  currentValuation: number | null;
  currentInvestment: number | null;
  operators: Operator[];
}) {
  const [operatorId, setOperatorId] = useState<string>(currentId ?? "");
  const [valEok, setValEok] = useState<string>(
    currentValuation != null ? String(currentValuation / 100) : ""
  );
  const [invEok, setInvEok] = useState<string>(
    currentInvestment != null ? String(currentInvestment / 100) : ""
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = (overrides?: { operatorId?: string; val?: string; inv?: string }) => {
    const op = overrides?.operatorId ?? operatorId;
    const v = overrides?.val ?? valEok;
    const i = overrides?.inv ?? invEok;
    setError(null);
    startTransition(async () => {
      const r = await updateTipsOperatorMatchAction(
        companyId,
        op || null,
        v === "" || v == null ? null : Number(v),
        i === "" || i == null ? null : Number(i)
      );
      if (r.error) setError(r.error);
      else setSavedAt(Date.now());
    });
  };

  const onOperatorChange = (v: string) => {
    setOperatorId(v);
    if (v === "") {
      // 매칭 해제 시 조건도 초기화
      setValEok("");
      setInvEok("");
      save({ operatorId: "", val: "", inv: "" });
    } else {
      save({ operatorId: v });
    }
  };

  const matched = operators.find((o) => o.id === operatorId);

  return (
    <div className="text-sm space-y-3">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={operatorId}
            onChange={(e) => onOperatorChange(e.target.value)}
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
            담당 심사역:{" "}
            <span className="text-zinc-700 font-medium">{matched.assigned_pm ?? "—"}</span>
            {matched.focus_area ? (
              <span className="text-zinc-400"> · {matched.focus_area}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {operatorId ? (
        <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">밸류 (억)</label>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={valEok}
              onChange={(e) => setValEok(e.target.value)}
              onBlur={() => save()}
              placeholder="예: 80"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">투자금액 (억)</label>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={invEok}
              onChange={(e) => setInvEok(e.target.value)}
              onBlur={() => save()}
              placeholder="예: 5"
              className="text-sm"
            />
          </div>
        </div>
      ) : null}

      {error ? <div className="text-xs text-rose-700">{error}</div> : null}
      {!error && savedAt && !pending ? (
        <div className="text-xs text-green-700">✓ 저장됨</div>
      ) : null}
    </div>
  );
}
