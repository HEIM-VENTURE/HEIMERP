"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHvpAction, updateHvpAction, deleteHvpAction } from "./actions";

export type HvpValues = {
  id?: string;
  name?: string | null;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
  cohort?: string | null;
  status?: string | null;
  default_fee_rate?: number | null;
  notes?: string | null;
};

const STATUS_OPTIONS = [
  { value: "active", label: "활성" },
  { value: "training", label: "교육중" },
  { value: "applied", label: "신청" },
  { value: "inactive", label: "휴면" },
];

function Fields({ v }: { v: HvpValues }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="이름 *">
          <Input name="name" required autoFocus defaultValue={v.name ?? ""} placeholder="홍길동" />
        </Field>
        <Field label="소속">
          <Input name="organization" defaultValue={v.organization ?? ""} placeholder="㈜OOO / 프리랜서" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="연락처">
          <Input name="phone" type="tel" defaultValue={v.phone ?? ""} placeholder="010-0000-0000" />
        </Field>
        <Field label="이메일">
          <Input name="email" type="email" defaultValue={v.email ?? ""} placeholder="name@example.com" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="기수">
          <Input name="cohort" defaultValue={v.cohort ?? ""} placeholder="5기" />
        </Field>
        <Field label="상태">
          <select
            name="status"
            defaultValue={v.status ?? "active"}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="수수료율 (%)">
          <Input
            name="default_fee_rate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            defaultValue={v.default_fee_rate != null ? (Number(v.default_fee_rate) * 100).toFixed(1) : 20}
          />
        </Field>
      </div>
      <Field label="메모">
        <textarea
          name="notes"
          rows={2}
          defaultValue={v.notes ?? ""}
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </Field>
    </>
  );
}

export function NewHvpModal() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await createHvpAction(formData);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ HVP 추가</Button>
      {open ? (
        <Shell title="새 HVP 추가" onClose={() => setOpen(false)}>
          <form action={onSubmit} className="space-y-3">
            <Fields v={{}} />
            {error ? <ErrBox msg={error} /> : null}
            <Btns pending={pending} onCancel={() => setOpen(false)} label="추가" />
          </form>
        </Shell>
      ) : null}
    </>
  );
}

export function EditHvpButton({ hvp }: { hvp: HvpValues & { id: string } }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await updateHvpAction(hvp.id, formData);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const onDelete = () => {
    startTransition(async () => {
      const r = await deleteHvpAction(hvp.id);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      >
        수정
      </button>
      {open ? (
        <Shell title="HVP 수정" subtitle={hvp.name ?? ""} onClose={() => setOpen(false)}>
          <form action={onSubmit} className="space-y-3">
            <Fields v={hvp} />
            {error ? <ErrBox msg={error} /> : null}
            <div className="flex gap-2 mt-6">
              {confirmingDelete ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={pending}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onDelete}
                    disabled={pending}
                    className="text-rose-700 hover:bg-rose-50 border-rose-300"
                  >
                    {pending ? "삭제 중..." : `정말 ${hvp.name} 삭제`}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={pending}
                  className="text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  삭제
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                취소
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Shell>
      ) : null}
    </>
  );
}

function Shell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
            {subtitle ? <p className="text-xs text-zinc-500 mt-1">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-zinc-700 mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{msg}</div>
  );
}

function Btns({ pending, onCancel, label }: { pending: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="flex gap-2 mt-6">
      <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={pending}>
        취소
      </Button>
      <Button type="submit" className="flex-1" disabled={pending}>
        {pending ? "처리 중..." : label}
      </Button>
    </div>
  );
}
