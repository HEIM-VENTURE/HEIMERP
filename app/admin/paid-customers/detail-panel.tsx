"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { updatePaidCustomer, type PaidCustomerPatch } from "./actions";

export type DetailPanelRow = {
  id: string;
  no: number | null;
  company_name: string;
  is_paid: boolean | null;
  new_corp_setup: string | null;
  new_company_name: string | null;
  target_program: string | null;
  urgency: number | null;
  legal_name: string | null;
  established_at: string | null;
  headcount: string | null;
  ir_deck_tips: string | null;
  ir_deck_lips: string | null;
  demoday_1_a: string | null;
  demoday_1_b: string | null;
  demoday_2_a: string | null;
  demoday_2_b: string | null;
  offline: string | null;
  memo: string | null;
};

type Draft = Omit<DetailPanelRow, "id" | "no">;

export function PaidCustomerDetailPanel({
  row,
  onClose,
}: {
  row: DetailPanelRow;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(row));
  const [pending, start] = useTransition();

  useEffect(() => {
    setDraft(toDraft(row));
  }, [row]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setField = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const patch = buildPatch(row, draft);
    if (Object.keys(patch).length === 0) {
      toast.info("변경사항이 없습니다.");
      return;
    }
    start(async () => {
      const res = await updatePaidCustomer(row.id, patch);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("저장되었습니다.");
      onClose();
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="고객 현황 상세 편집"
        className="fixed right-0 top-0 z-50 h-full w-[min(560px,100vw)] bg-white border-l border-zinc-200 shadow-2xl flex flex-col"
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 shrink-0">
          <div>
            <div className="text-[11px] text-zinc-400 tabular-nums">
              {row.no ? `#${row.no}` : "신규"}
            </div>
            <div className="text-[15px] font-semibold text-zinc-900">
              {draft.company_name || "(회사명 없음)"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-[12.5px]">
          <Section title="기본 정보">
            <Field label="회사명">
              <TextInput
                value={draft.company_name}
                onChange={(v) => setField("company_name", v ?? "")}
              />
            </Field>
            <Field label="법인 등기명">
              <TextInput value={draft.legal_name} onChange={(v) => setField("legal_name", v)} />
            </Field>
            <Field label="신규회사명 (예정)">
              <TextInput
                value={draft.new_company_name}
                onChange={(v) => setField("new_company_name", v)}
              />
            </Field>
            <Field label="신규법인 설립">
              <TextInput
                value={draft.new_corp_setup}
                onChange={(v) => setField("new_corp_setup", v)}
                placeholder="O · ? · 설립예정 등"
              />
            </Field>
          </Section>

          <Section title="상태">
            <div className="grid grid-cols-2 gap-3">
              <Field label="결제여부">
                <select
                  value={draft.is_paid === null ? "" : String(draft.is_paid)}
                  onChange={(e) =>
                    setField(
                      "is_paid",
                      e.target.value === "" ? null : e.target.value === "true",
                    )
                  }
                  className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-brand"
                >
                  <option value="">미정</option>
                  <option value="true">결제</option>
                  <option value="false">미결제</option>
                </select>
              </Field>
              <Field label="긴급도">
                <select
                  value={draft.urgency === null ? "" : String(draft.urgency)}
                  onChange={(e) =>
                    setField("urgency", e.target.value === "" ? null : Number(e.target.value))
                  }
                  className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-brand"
                >
                  <option value="">-</option>
                  <option value="1">1 (긴급)</option>
                  <option value="2">2 (보통)</option>
                  <option value="3">3 (여유)</option>
                </select>
              </Field>
            </div>
            <Field label="타깃 프로그램">
              <TextInput
                value={draft.target_program}
                onChange={(v) => setField("target_program", v)}
                placeholder="예: 팁스,립스,투자 (콤마 구분)"
              />
            </Field>
          </Section>

          <Section title="법인 정보">
            <div className="grid grid-cols-2 gap-3">
              <Field label="설립일">
                <TextInput
                  value={draft.established_at}
                  onChange={(v) => setField("established_at", v)}
                  placeholder="YYYY-MM-DD 또는 '설립전'"
                />
              </Field>
              <Field label="직원 수">
                <TextInput
                  value={draft.headcount}
                  onChange={(v) => setField("headcount", v)}
                  placeholder="예: 6명"
                />
              </Field>
            </div>
          </Section>

          <Section title="IR Deck 진행">
            <div className="grid grid-cols-2 gap-3">
              <Field label="IR Deck (팁스)">
                <TextInput
                  value={draft.ir_deck_tips}
                  onChange={(v) => setField("ir_deck_tips", v)}
                  placeholder="O · 1주후 등"
                />
              </Field>
              <Field label="IR Deck (립스)">
                <TextInput
                  value={draft.ir_deck_lips}
                  onChange={(v) => setField("ir_deck_lips", v)}
                  placeholder="O · 2주후 등"
                />
              </Field>
            </div>
          </Section>

          <Section title="데모데이 · 오프라인">
            <div className="grid grid-cols-2 gap-3">
              <Field label="1차 데모데이 A">
                <TextInput value={draft.demoday_1_a} onChange={(v) => setField("demoday_1_a", v)} />
              </Field>
              <Field label="1차 데모데이 B">
                <TextInput value={draft.demoday_1_b} onChange={(v) => setField("demoday_1_b", v)} />
              </Field>
              <Field label="2차 데모데이 A">
                <TextInput value={draft.demoday_2_a} onChange={(v) => setField("demoday_2_a", v)} />
              </Field>
              <Field label="2차 데모데이 B">
                <TextInput value={draft.demoday_2_b} onChange={(v) => setField("demoday_2_b", v)} />
              </Field>
            </div>
            <Field label="오프라인">
              <TextInput value={draft.offline} onChange={(v) => setField("offline", v)} />
            </Field>
          </Section>

          <Section title="내부 메모">
            <textarea
              rows={4}
              value={draft.memo ?? ""}
              onChange={(e) => setField("memo", e.target.value === "" ? null : e.target.value)}
              placeholder="대표님 코멘트 · 후속 액션 · 참고 링크 등"
              className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-brand resize-y"
            />
          </Section>
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-zinc-200 text-[13px] text-zinc-700 hover:bg-zinc-50"
            disabled={pending}
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            className="px-3 py-1.5 rounded-md bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-60"
            disabled={pending}
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </footer>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function toDraft(row: DetailPanelRow): Draft {
  const { id: _id, no: _no, ...rest } = row;
  return rest;
}

function buildPatch(original: DetailPanelRow, draft: Draft): PaidCustomerPatch {
  const patch: PaidCustomerPatch = {};
  for (const key of Object.keys(draft) as (keyof Draft)[]) {
    const before = original[key] ?? null;
    const after = normalize(draft[key]);
    if (before !== after) {
      // 타입 안전: PaidCustomerPatch 는 각 필드 타입을 알고 있음
      (patch as Record<string, unknown>)[key] = after;
    }
  }
  return patch;
}

function normalize(v: unknown): unknown {
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  return v ?? null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-normal text-zinc-500 mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11.5px] text-zinc-500 mb-1">{label}</div>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      placeholder={placeholder}
      className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-brand"
    />
  );
}
