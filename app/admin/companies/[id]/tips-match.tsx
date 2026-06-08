"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addTipsMatchAction,
  updateTipsMatchAction,
  deleteTipsMatchAction,
} from "./actions";

type Operator = {
  id: string;
  name: string;
  assigned_pm: string | null;
  focus_area: string | null;
};

export type Match = {
  id: number;
  tips_operator_id: string;
  valuation: number | null; // 백만원
  investment: number | null; // 백만원
};

export function TipsMatches({
  companyId,
  matches,
  operators,
}: {
  companyId: number;
  matches: Match[];
  operators: Operator[];
}) {
  const usedIds = new Set(matches.map((m) => m.tips_operator_id));
  const available = operators.filter((o) => !usedIds.has(o.id));

  return (
    <div className="space-y-3">
      {matches.length === 0 ? (
        <div className="text-xs text-zinc-400">아직 매칭된 운영사가 없습니다</div>
      ) : (
        <div className="space-y-2.5">
          {matches.map((m) => {
            const op = operators.find((o) => o.id === m.tips_operator_id);
            return (
              <MatchRow
                key={m.id}
                companyId={companyId}
                match={m}
                operator={op}
              />
            );
          })}
        </div>
      )}

      {available.length > 0 ? (
        <AddMatchForm companyId={companyId} operators={available} />
      ) : (
        <div className="text-xs text-zinc-400 italic">모든 운영사가 매칭됐습니다</div>
      )}
    </div>
  );
}

function MatchRow({
  companyId,
  match,
  operator,
}: {
  companyId: number;
  match: Match;
  operator: Operator | undefined;
}) {
  const router = useRouter();
  const valFromDb = match.valuation != null ? String(match.valuation / 100) : "";
  const invFromDb = match.investment != null ? String(match.investment / 100) : "";
  const [val, setVal] = useState(valFromDb);
  const [inv, setInv] = useState(invFromDb);
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // 부모가 새 data 로 재렌더 되면(다른 매칭 추가 등) 이 행 input 도 DB 값으로 sync
  // — 단, 사용자가 편집 중이면 덮어쓰지 않도록 마지막 저장 시점 이후 prop 변경만 반영
  const lastSyncRef = useRef({ val: valFromDb, inv: invFromDb });
  useEffect(() => {
    if (valFromDb !== lastSyncRef.current.val) {
      setVal(valFromDb);
      lastSyncRef.current.val = valFromDb;
    }
    if (invFromDb !== lastSyncRef.current.inv) {
      setInv(invFromDb);
      lastSyncRef.current.inv = invFromDb;
    }
  }, [valFromDb, invFromDb]);

  // closure 정합성 — 최신 val/inv 를 ref 에 항상 보관
  const latest = useRef({ val, inv });
  useEffect(() => {
    latest.current = { val, inv };
  });

  const save = () => {
    const v = latest.current.val;
    const i = latest.current.inv;
    setError(null);
    startTransition(async () => {
      const r = await updateTipsMatchAction(
        match.id,
        companyId,
        v === "" ? null : Number(v),
        i === "" ? null : Number(i)
      );
      if (r.error) setError(r.error);
      else {
        setSavedAt(Date.now());
        lastSyncRef.current = { val: v, inv: i };
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const r = await deleteTipsMatchAction(match.id, companyId);
      if (r.error) alert(r.error);
      else router.refresh();
    });
  };

  return (
    <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/30">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-900 truncate">
            {operator?.name ?? "(알 수 없는 운영사)"}
          </div>
          {operator ? (
            <div className="text-[11px] text-zinc-500 truncate">
              {operator.assigned_pm ? `${operator.assigned_pm}` : ""}
              {operator.assigned_pm && operator.focus_area ? " · " : ""}
              {operator.focus_area ?? ""}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {pending ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : null}
          {confirming ? (
            <>
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="text-[11px] px-2 py-1 rounded text-zinc-500 hover:text-zinc-900"
              >
                취소
              </button>
              <button
                onClick={onDelete}
                disabled={pending}
                className="text-[11px] px-2 py-1 rounded bg-rose-100 text-rose-700 hover:bg-rose-200"
              >
                정말 삭제
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={pending}
              className="text-zinc-300 hover:text-rose-600 p-1"
              title="매칭 해제"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-zinc-500 mb-0.5 block">밸류 (억)</label>
          <Input
            type="number"
            min={0}
            step="0.1"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={save}
            placeholder="예: 80"
            className="h-8 text-xs"
            disabled={pending}
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 mb-0.5 block">투자금액 (억)</label>
          <Input
            type="number"
            min={0}
            step="0.1"
            value={inv}
            onChange={(e) => setInv(e.target.value)}
            onBlur={save}
            placeholder="예: 5"
            className="h-8 text-xs"
            disabled={pending}
          />
        </div>
      </div>
      {error ? (
        <div className="text-[11px] text-rose-700 mt-2">{error}</div>
      ) : null}
      {!error && savedAt && !pending ? (
        <div className="text-[11px] text-green-700 mt-2">✓ 저장됨</div>
      ) : null}
    </div>
  );
}

function AddMatchForm({
  companyId,
  operators,
}: {
  companyId: number;
  operators: Operator[];
}) {
  const router = useRouter();
  const [opId, setOpId] = useState("");
  const [val, setVal] = useState("");
  const [inv, setInv] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onAdd = () => {
    if (!opId) {
      setError("운영사를 선택하세요");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await addTipsMatchAction(
        companyId,
        opId,
        val === "" ? null : Number(val),
        inv === "" ? null : Number(inv)
      );
      if (r.error) setError(r.error);
      else {
        setOpId("");
        setVal("");
        setInv("");
        router.refresh();
      }
    });
  };

  return (
    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-3 space-y-2">
      <div className="text-[11px] font-medium text-zinc-500">+ 운영사 매칭 추가</div>
      <select
        value={opId}
        onChange={(e) => setOpId(e.target.value)}
        disabled={pending}
        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
      >
        <option value="">— 운영사 선택 —</option>
        {operators.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
            {o.focus_area ? ` (${o.focus_area})` : ""}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          min={0}
          step="0.1"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="밸류 (억)"
          className="h-8 text-xs"
          disabled={pending}
        />
        <Input
          type="number"
          min={0}
          step="0.1"
          value={inv}
          onChange={(e) => setInv(e.target.value)}
          placeholder="투자금액 (억)"
          className="h-8 text-xs"
          disabled={pending}
        />
      </div>
      {error ? <div className="text-xs text-rose-700">{error}</div> : null}
      <Button size="sm" onClick={onAdd} disabled={pending || !opId} className="w-full text-xs h-8">
        {pending ? "추가 중..." : "추가"}
      </Button>
    </div>
  );
}
