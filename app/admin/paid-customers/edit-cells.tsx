"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, X, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { updatePaidCustomer, type PaidCustomerPatch } from "./actions";

/**
 * 셀 클릭 → 편집 모드 → blur/Enter 저장, Esc 취소.
 * 저장 실패 시 이전 값으로 롤백하고 sonner 토스트로 알림.
 * 표시(read) 시에는 render 함수의 노드를 그대로 노출해 배지 룩앤필 유지.
 */

type BaseProps<T> = {
  id: string;
  field: keyof PaidCustomerPatch;
  value: T;
};

function useSaver(id: string, field: keyof PaidCustomerPatch) {
  const [pending, start] = useTransition();

  const save = (next: unknown, onRollback: () => void) =>
    start(async () => {
      const patch = { [field]: next as never } as PaidCustomerPatch;
      const res = await updatePaidCustomer(id, patch);
      if (!res.ok) {
        onRollback();
        toast.error(res.error);
      }
    });

  return { save, pending };
}

// ─────────────────────────────────────────────
// TextEditCell — 자유 텍스트 (설립일, 인원, 데모데이, 회사명 등)
// ─────────────────────────────────────────────
type TextCellProps = BaseProps<string | null> & {
  placeholder?: string;
  render?: (v: string | null) => React.ReactNode;
  inputClassName?: string;
  cellClassName?: string;
  multiline?: boolean;
};

export function TextEditCell({
  id,
  field,
  value,
  placeholder,
  render,
  inputClassName,
  cellClassName,
  multiline,
}: TextCellProps) {
  const [local, setLocal] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { save, pending } = useSaver(id, field);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim() === "" ? null : draft.trim();
    setEditing(false);
    if (next === (local ?? null)) return;
    const prev = local;
    setLocal(next);
    save(next, () => setLocal(prev));
  };

  const cancel = () => {
    setDraft(local ?? "");
    setEditing(false);
  };

  if (editing) {
    const commonProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      },
      placeholder,
      className:
        inputClassName ??
        "w-full min-w-[80px] px-1 py-0.5 border border-brand rounded text-[12px] bg-white text-zinc-900 focus:outline-none",
    };
    return multiline ? (
      <textarea
        ref={inputRef as React.Ref<HTMLTextAreaElement>}
        rows={2}
        {...commonProps}
      />
    ) : (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="text"
        {...commonProps}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(local ?? "");
        setEditing(true);
      }}
      className={`w-full text-left rounded px-1 py-0.5 -mx-1 hover:bg-zinc-100/70 transition-colors ${pending ? "opacity-60" : ""} ${cellClassName ?? ""}`}
      title="클릭해 편집"
    >
      {render ? (
        render(local)
      ) : local ? (
        <span className="text-[12px] text-zinc-800">{local}</span>
      ) : (
        <span className="text-zinc-300">-</span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// PaidToggleCell — 결제여부 3상태 순환 (null → true → false → null)
// ─────────────────────────────────────────────
export function PaidToggleCell({ id, value }: { id: string; value: boolean | null }) {
  const [local, setLocal] = useState<boolean | null>(value);
  const { save, pending } = useSaver(id, "is_paid");

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const cycle = () => {
    const next = local === null ? true : local === true ? false : null;
    const prev = local;
    setLocal(next);
    save(next, () => setLocal(prev));
  };

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={pending}
      className={`inline-flex items-center gap-0.5 rounded-full transition-colors ${pending ? "opacity-60" : ""}`}
      title="클릭해 결제여부 변경 (미정 → 결제 → 미결제)"
    >
      {local === true ? (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-medium hover:bg-emerald-100">
          <Check className="w-2.5 h-2.5" /> 결제
        </span>
      ) : local === false ? (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10.5px] font-medium hover:bg-rose-100">
          <X className="w-2.5 h-2.5" /> 미결제
        </span>
      ) : (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10.5px] font-medium hover:bg-zinc-200">
          미정
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// UrgencySelectCell — 긴급도 (null / 1 / 2 / 3)
// ─────────────────────────────────────────────
const URGENCY_STYLES: Record<number, string> = {
  1: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  2: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  3: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
};

export function UrgencySelectCell({ id, value }: { id: string; value: number | null }) {
  const [local, setLocal] = useState<number | null>(value);
  const [editing, setEditing] = useState(false);
  const { save, pending } = useSaver(id, "urgency");

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const set = (next: number | null) => {
    setEditing(false);
    if (next === local) return;
    const prev = local;
    setLocal(next);
    save(next, () => setLocal(prev));
  };

  if (editing) {
    return (
      <select
        autoFocus
        value={local ?? ""}
        onChange={(e) => set(e.target.value === "" ? null : Number(e.target.value))}
        onBlur={() => setEditing(false)}
        className="px-1 py-0.5 border border-brand rounded text-[11px] bg-white focus:outline-none"
      >
        <option value="">-</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={pending}
      className={`inline-block rounded transition-colors ${pending ? "opacity-60" : ""}`}
      title="클릭해 긴급도 변경"
    >
      {local ? (
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-semibold tabular-nums ${URGENCY_STYLES[local] ?? "bg-zinc-100 text-zinc-600"}`}
        >
          {local}
        </span>
      ) : (
        <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-50 text-zinc-300 text-[10.5px] hover:bg-zinc-100">
          -
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// StatusCell 표시 헬퍼 — TextEditCell 의 render 로 전달
// O = 초록 체크, ? = 회색 물음표, 그 외 문자열 = 텍스트, 빈값 = -
// ─────────────────────────────────────────────
export function statusBadge(v: string | null) {
  if (!v) return <span className="text-zinc-300">-</span>;
  if (v === "O") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-medium">
        <Check className="w-2.5 h-2.5" />
      </span>
    );
  }
  if (v === "?") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[10.5px]">
        <HelpCircle className="w-2.5 h-2.5" />
      </span>
    );
  }
  return <span className="text-[11px] text-zinc-700">{v}</span>;
}

export function programBadges(v: string | null) {
  if (!v) return <span className="text-zinc-300">-</span>;
  const parts = v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-wrap gap-0.5">
      {parts.map((p) => (
        <span
          key={p}
          className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10.5px]"
        >
          {p}
        </span>
      ))}
    </div>
  );
}
