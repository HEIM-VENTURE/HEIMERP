"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTipsOperatorAction,
  updateTipsOperatorAction,
  deleteTipsOperatorAction,
} from "./actions";

type Operator = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  focus_area: string | null;
  notes: string | null;
};

export function NewOperatorModal() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await createTipsOperatorAction(formData);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ 운영사 추가</Button>
      {open ? (
        <Shell title="새 운영사 추가" onClose={() => setOpen(false)}>
          <form action={onSubmit} className="space-y-3">
            <Fields v={{}} />
            {error ? <ErrBox msg={error} /> : null}
            <Buttons
              pending={pending}
              onCancel={() => setOpen(false)}
              submitLabel="추가"
            />
          </form>
        </Shell>
      ) : null}
    </>
  );
}

export function EditOperatorRow({ operator }: { operator: Operator }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await updateTipsOperatorAction(operator.id, formData);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      const r = await deleteTipsOperatorAction(operator.id);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-brand underline"
      >
        편집
      </button>
      {open ? (
        <Shell title="운영사 편집" subtitle={operator.name} onClose={() => setOpen(false)}>
          <form action={onSubmit} className="space-y-3">
            <Fields v={operator} />
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
                    {pending ? "삭제 중..." : "정말 삭제"}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
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

function Fields({ v }: { v: Partial<Operator> }) {
  return (
    <>
      <Field label="기관명 *">
        <Input name="name" required defaultValue={v.name ?? ""} placeholder="예: 한국과학기술지주" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="담당자">
          <Input name="contact_person" defaultValue={v.contact_person ?? ""} />
        </Field>
        <Field label="분야">
          <Input
            name="focus_area"
            defaultValue={v.focus_area ?? ""}
            placeholder="예: 바이오, ICT"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="연락처">
          <Input name="phone" defaultValue={v.phone ?? ""} placeholder="02-0000-0000" />
        </Field>
        <Field label="이메일">
          <Input name="email" type="email" defaultValue={v.email ?? ""} />
        </Field>
      </div>
      <Field label="메모">
        <textarea
          name="notes"
          rows={3}
          defaultValue={v.notes ?? ""}
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </Field>
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
            {subtitle ? <p className="text-xs text-zinc-500 mt-1">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 text-xl leading-none"
          >
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
      <label className="text-xs font-medium text-zinc-700 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
      {msg}
    </div>
  );
}

function Buttons({
  pending,
  onCancel,
  submitLabel,
}: {
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex gap-2 mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1"
        disabled={pending}
      >
        취소
      </Button>
      <Button type="submit" className="flex-1" disabled={pending}>
        {pending ? "처리 중..." : submitLabel}
      </Button>
    </div>
  );
}
