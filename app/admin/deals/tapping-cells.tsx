"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { updateTappingField, createTappingRow, deleteTappingRow, type TappingField } from "./tapping-actions";

/** 인라인 편집 텍스트 셀 · 클릭 → input · Enter/blur 저장 · 낙관적 UI */
export function EditCell({
  id,
  field,
  initial,
  placeholder,
  align = "left",
  minWidth,
}: {
  id: string;
  field: TappingField;
  initial: string | null;
  placeholder?: string;
  align?: "left" | "center" | "right";
  minWidth?: number;
}) {
  const [value, setValue] = useState<string>(initial ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(initial ?? "");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(initial ?? "");
  }, [initial]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft;
    if (next === value) {
      setEditing(false);
      return;
    }
    start(async () => {
      const res = await updateTappingField(id, field, next);
      if (res.error) {
        alert(`저장 실패: ${res.error}`);
        setDraft(value);
      } else {
        setValue(next);
      }
      setEditing(false);
    });
  };

  const alignCls = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        disabled={pending}
        className={`w-full h-6 px-1.5 rounded border border-brand text-[12px] focus:outline-none ${alignCls}`}
        style={{ minWidth: minWidth ? `${minWidth}px` : undefined }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={`w-full min-h-[24px] px-1.5 py-0.5 rounded hover:bg-zinc-100 transition-colors text-[12.5px] ${alignCls} ${pending ? "opacity-60" : ""}`}
      style={{ minWidth: minWidth ? `${minWidth}px` : undefined }}
    >
      {value ? (
        <span className="text-zinc-900">{value}</span>
      ) : (
        <span className="text-zinc-300">{placeholder ?? "—"}</span>
      )}
    </button>
  );
}

/** 여/부/대기중 · 드롭다운 셀 */
export function EligibleCell({
  id,
  field,
  initial,
}: {
  id: string;
  field: TappingField;
  initial: string | null;
}) {
  const [value, setValue] = useState<string>(initial ?? "");
  const [pending, start] = useTransition();

  useEffect(() => {
    setValue(initial ?? "");
  }, [initial]);

  const change = (next: string) => {
    if (next === value) return;
    start(async () => {
      const res = await updateTappingField(id, field, next);
      if (res.error) {
        alert(`저장 실패: ${res.error}`);
      } else {
        setValue(next);
      }
    });
  };

  const badge =
    value === "여"
      ? "bg-emerald-100 text-emerald-700"
      : value === "부"
      ? "bg-rose-100 text-rose-700"
      : value === "대기중"
      ? "bg-amber-100 text-amber-700"
      : "bg-zinc-100 text-zinc-400";

  return (
    <div className="flex items-center justify-center relative">
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full appearance-none cursor-pointer ${badge} ${pending ? "opacity-60" : ""}`}
      >
        <option value="">—</option>
        <option value="여">여</option>
        <option value="부">부</option>
        <option value="대기중">대기중</option>
      </select>
    </div>
  );
}

/** 신규 태핑 행 추가 · 인라인 인풋 */
export function AddTappingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const submit = () => {
    const v = name.trim();
    if (!v) return;
    start(async () => {
      const res = await createTappingRow(v);
      if (res.error) {
        alert(res.error);
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand text-white text-[12px] font-medium hover:opacity-90"
      >
        <Plus className="w-3.5 h-3.5" />
        신규 추가
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          else if (e.key === "Escape") {
            setOpen(false);
            setName("");
          }
        }}
        disabled={pending}
        placeholder="기업명"
        className="h-7 px-2 rounded-md border border-zinc-300 text-[12px] w-40 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="h-7 px-3 rounded-md bg-brand text-white text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "..." : "추가"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setName("");
        }}
        disabled={pending}
        className="h-7 px-2 rounded-md text-[12px] text-zinc-500 hover:text-zinc-900"
      >
        취소
      </button>
    </div>
  );
}

/** 행 삭제 아이콘 버튼 */
export function DeleteRowButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm(`"${name}" 태핑 행을 삭제하시겠습니까?`)) return;
        start(async () => {
          const res = await deleteTappingRow(id);
          if (res.error) {
            alert(res.error);
            return;
          }
          router.refresh();
        });
      }}
      disabled={pending}
      className="p-1 rounded hover:bg-rose-50 text-zinc-300 hover:text-rose-600 transition-colors"
      title="행 삭제"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
