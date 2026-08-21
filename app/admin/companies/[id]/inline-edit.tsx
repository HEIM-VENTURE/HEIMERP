"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateCompanyField, type CompanyPatch } from "./actions";

/**
 * 기업 마스터 상세 - 인라인 편집 필드.
 * 라벨(고정) + 값(클릭 → 편집 모드) 한 줄. blur/Enter 저장, Esc 취소.
 * 낙관적 UI + 실패 시 롤백 + sonner 토스트.
 *
 * multiline=true 이면 textarea (메모·접수목적 등).
 */
type Props = {
  companyId: number;
  field: keyof CompanyPatch;
  value: string | number | null;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "date" | "number";
  render?: (v: string | number | null) => React.ReactNode;
  className?: string;
};

export function EditableCompanyField({
  companyId,
  field,
  value,
  label,
  placeholder,
  multiline,
  type = "text",
  render,
  className,
}: Props) {
  const [local, setLocal] = useState<string | number | null>(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value == null ? "" : String(value));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if ("select" in inputRef.current) inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    let next: string | number | null = trimmed === "" ? null : trimmed;
    if (type === "number" && next !== null) {
      const n = Number(String(next).replace(/,/g, ""));
      if (!Number.isFinite(n)) {
        toast.error("숫자만 입력하세요.");
        setDraft(local == null ? "" : String(local));
        return;
      }
      next = n;
    }
    if (String(next ?? "") === String(local ?? "")) return;

    const prev = local;
    setLocal(next);
    start(async () => {
      const res = await updateCompanyField(companyId, { [field]: next } as CompanyPatch);
      if (!res.ok) {
        setLocal(prev);
        toast.error(res.error);
      }
    });
  };

  const cancel = () => {
    setDraft(local == null ? "" : String(local));
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
        "w-full px-2 py-1 border border-brand rounded text-[12.5px] bg-white text-zinc-900 focus:outline-none",
    };
    return multiline ? (
      <textarea
        ref={inputRef as React.Ref<HTMLTextAreaElement>}
        rows={4}
        {...commonProps}
      />
    ) : (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type={type === "date" ? "text" : type}
        {...commonProps}
      />
    );
  }

  const displayValue = render
    ? render(local)
    : local == null || local === "" ? (
        <span className="text-zinc-300">—</span>
      ) : (
        <span className="text-zinc-900">{String(local)}</span>
      );

  const clickable = (
    <button
      type="button"
      onClick={() => {
        setDraft(local == null ? "" : String(local));
        setEditing(true);
      }}
      className={`text-left rounded px-1.5 py-0.5 -mx-1.5 hover:bg-zinc-100 transition-colors ${pending ? "opacity-60" : ""} ${className ?? ""}`}
      title="클릭해 편집"
    >
      {displayValue}
    </button>
  );

  // label 있으면 좌우 대비 라인, 없으면 단독 셀
  if (label) {
    return (
      <div className="flex justify-between items-start gap-2">
        <span className="text-zinc-500 shrink-0">{label}</span>
        <div className="min-w-0 text-right">{clickable}</div>
      </div>
    );
  }
  return clickable;
}
