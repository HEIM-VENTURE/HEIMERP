"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompanyAction, updateCompanyAction } from "./actions";

type Hvp = { id: string; name: string; cohort: string | null };

type CompanyValues = {
  id?: number;
  name?: string | null;
  address?: string | null;
  ceo_name?: string | null;
  phone?: string | null;
  email?: string | null;
  main_item?: string | null;
  founded_at?: string | null;
  last_year_revenue?: number | null;
  inquiry_purpose?: string | null;
  proposal_amount?: number | null;
  program_grade?: string | null;
  hvp_id?: string | null;
  notes?: string | null;
};

const GRADE_OPTIONS = [
  { value: "none", label: "— 미정" },
  { value: "premium", label: "Premium" },
  { value: "basic", label: "Basic" },
  { value: "free", label: "Free" },
];

const SALES_STAGE_OPTIONS = [
  { value: "received", label: "접수" },
  { value: "meeting_1st", label: "1차 미팅" },
  { value: "proposal", label: "제안" },
  { value: "contract", label: "계약" },
  { value: "kickoff", label: "착수" },
];

// ============================================================
// 공통 폼 필드
// ============================================================
function CompanyFormFields({
  hvps,
  values,
  showStage,
}: {
  hvps: Hvp[];
  values: CompanyValues;
  showStage: boolean;
}) {
  return (
    <>
      <Field label="회사명 *">
        <Input name="name" required autoFocus defaultValue={values.name ?? ""} placeholder="㈜OOO" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="대표자명">
          <Input name="ceo_name" defaultValue={values.ceo_name ?? ""} placeholder="홍길동" />
        </Field>
        <Field label="소재지">
          <Input name="address" defaultValue={values.address ?? ""} placeholder="서울 강남구" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="연락처">
          <Input name="phone" type="tel" defaultValue={values.phone ?? ""} placeholder="010-0000-0000" />
        </Field>
        <Field label="이메일">
          <Input name="email" type="email" defaultValue={values.email ?? ""} placeholder="ceo@example.com" />
        </Field>
      </div>

      <Field label="주요 아이템">
        <Input name="main_item" defaultValue={values.main_item ?? ""} placeholder="예: AI 헬스케어 SaaS" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="설립일자">
          <Input name="founded_at" type="date" defaultValue={values.founded_at ?? ""} />
        </Field>
        <Field label="직전년도 매출 (백만원)">
          <Input
            name="last_year_revenue"
            type="number"
            min={0}
            defaultValue={values.last_year_revenue ?? ""}
            placeholder="120"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="컨설팅 제안금액 (만원)">
          <Input
            name="proposal_amount"
            type="number"
            min={0}
            defaultValue={values.proposal_amount ?? ""}
            placeholder="3000"
          />
        </Field>
        <Field label="프로그램 등급">
          <select
            name="program_grade"
            defaultValue={values.program_grade ?? "none"}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className={`grid gap-3 ${showStage ? "grid-cols-2" : "grid-cols-1"}`}>
        <Field label="담당 HVP">
          <select
            name="hvp_id"
            defaultValue={values.hvp_id ?? "none"}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
          >
            <option value="none">— 없음</option>
            {hvps.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} {h.cohort ? `(${h.cohort})` : ""}
              </option>
            ))}
          </select>
        </Field>
        {showStage ? (
          <Field label="영업 단계">
            <select
              name="sales_stage"
              defaultValue="received"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
            >
              {SALES_STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      <Field label="접수 목적 / 메모">
        <textarea
          name="inquiry_purpose"
          rows={2}
          defaultValue={values.inquiry_purpose ?? ""}
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          placeholder="예: TIPS 컨설팅 / 투자 유치"
        />
      </Field>

      <Field label="추가 메모">
        <textarea
          name="notes"
          rows={2}
          defaultValue={values.notes ?? ""}
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          placeholder="내부 메모"
        />
      </Field>
    </>
  );
}

// ============================================================
// 신규 기업 모달
// ============================================================
export function NewCompanyModal({ hvps, label = "+ 신규" }: { hvps: Hvp[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createCompanyAction(formData);
      if (result.error) setError(result.error);
      else {
        setOpen(false);
        if (result.companyId) router.push(`/admin/companies/${result.companyId}`);
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      {open ? (
        <ModalShell
          title="새 기업 추가"
          subtitle="직접 입력으로 기업을 파이프라인에 등록합니다"
          onClose={() => setOpen(false)}
        >
          <form action={onSubmit} className="space-y-3">
            <CompanyFormFields hvps={hvps} values={{}} showStage />
            {error ? <ErrorBox msg={error} /> : null}
            <FormButtons pending={pending} onCancel={() => setOpen(false)} submitLabel="추가" />
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

// ============================================================
// 기업 편집 모달
// ============================================================
export function EditCompanyModal({
  hvps,
  company,
}: {
  hvps: Hvp[];
  company: CompanyValues & { id: number };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCompanyAction(company.id, formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        정보 편집
      </Button>
      {open ? (
        <ModalShell title="기업 정보 편집" subtitle={company.name ?? ""} onClose={() => setOpen(false)}>
          <form action={onSubmit} className="space-y-3">
            <CompanyFormFields hvps={hvps} values={company} showStage={false} />
            {error ? <ErrorBox msg={error} /> : null}
            <FormButtons pending={pending} onCancel={() => setOpen(false)} submitLabel="저장" />
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

// ============================================================
// 공통 UI 조각
// ============================================================
function ModalShell({
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
        className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
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

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
      {msg}
    </div>
  );
}

function FormButtons({
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
      <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={pending}>
        취소
      </Button>
      <Button type="submit" className="flex-1" disabled={pending}>
        {pending ? "처리 중..." : submitLabel}
      </Button>
    </div>
  );
}
