"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createContractAction,
  updateContractAction,
  markContractPaidAction,
  deleteContractAction,
} from "./actions";

type Company = { id: number; name: string; hvp_id: string | null; proposal_amount: number | null };
type Hvp = { id: string; name: string; cohort: string | null };

type ContractRow = {
  id: number;
  company_id: number;
  contracted_at: string;
  total_amount: number;
  hvp_id: string | null;
  hvp_fee_rate: number;
  payment_status: "scheduled" | "paid";
  notes: string | null;
};

// ============================================================
// 새 계약 모달
// ============================================================
export function NewContractModal({
  companies,
  hvps,
  defaultCompanyId,
}: {
  companies: Company[];
  hvps: Hvp[];
  defaultCompanyId?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | undefined>(defaultCompanyId);

  const selectedCompany = companies.find((c) => c.id === companyId);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createContractAction(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ 새 계약</Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">새 계약 추가</h3>
                <p className="text-xs text-zinc-500 mt-1">컨설팅 계약 금액·HVP 수수료 정보</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form action={onSubmit} className="space-y-3">
              <Field label="기업 *">
                <select
                  name="company_id"
                  required
                  value={companyId ?? ""}
                  onChange={(e) => setCompanyId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
                >
                  <option value="">— 선택 —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="계약일 *">
                  <Input
                    name="contracted_at"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </Field>
                <Field label="총 컨설팅 금액 (만원) *">
                  <Input
                    name="total_amount"
                    type="number"
                    min={0}
                    step={1}
                    required
                    defaultValue={selectedCompany?.proposal_amount ?? ""}
                    placeholder="예: 3000"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="HVP 담당자">
                  <select
                    name="hvp_id"
                    defaultValue={selectedCompany?.hvp_id ?? "none"}
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
                <Field label="수수료율 (%)">
                  <Input
                    name="hvp_fee_rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    defaultValue={20}
                  />
                </Field>
              </div>

              <Field label="메모 (선택)">
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  placeholder="계약 관련 메모"
                />
              </Field>

              {error ? (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                  disabled={pending}
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? "추가 중..." : "추가"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ============================================================
// 편집 모달 (트리거: 행 클릭)
// ============================================================
export function EditContractRow({
  contract,
  hvps,
  companyName,
}: {
  contract: ContractRow;
  hvps: Hvp[];
  companyName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ratePercent = (Number(contract.hvp_fee_rate) * 100).toFixed(1);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateContractAction(contract.id, formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  };

  const onTogglePaid = () => {
    startTransition(async () => {
      const result = await markContractPaidAction(
        contract.id,
        contract.payment_status !== "paid"
      );
      if (result.error) setError(result.error);
    });
  };

  const onDelete = () => {
    if (!confirm("이 계약을 삭제할까요? (되돌릴 수 없음)")) return;
    startTransition(async () => {
      const result = await deleteContractAction(contract.id);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-zinc-900 underline"
      >
        편집
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">계약 편집</h3>
                <p className="text-xs text-zinc-500 mt-1">{companyName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form action={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="계약일 *">
                  <Input
                    name="contracted_at"
                    type="date"
                    required
                    defaultValue={contract.contracted_at}
                  />
                </Field>
                <Field label="총 컨설팅 금액 (만원) *">
                  <Input
                    name="total_amount"
                    type="number"
                    min={0}
                    step={1}
                    required
                    defaultValue={contract.total_amount}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="HVP 담당자">
                  <select
                    name="hvp_id"
                    defaultValue={contract.hvp_id ?? "none"}
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
                <Field label="수수료율 (%)">
                  <Input
                    name="hvp_fee_rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    defaultValue={ratePercent}
                  />
                </Field>
              </div>

              <Field label="메모">
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={contract.notes ?? ""}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>

              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <div className="text-xs">
                  <div className="text-zinc-500">지급 상태</div>
                  <div
                    className={`font-medium ${
                      contract.payment_status === "paid" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {contract.payment_status === "paid" ? "✓ 지급 완료" : "● 지급 예정"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onTogglePaid}
                  disabled={pending}
                  className="text-xs"
                >
                  {contract.payment_status === "paid" ? "지급 취소" : "지급 완료 처리"}
                </Button>
              </div>

              {error ? (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDelete}
                  className="text-rose-700 hover:bg-rose-50"
                  disabled={pending}
                >
                  삭제
                </Button>
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
          </div>
        </div>
      ) : null}
    </>
  );
}

// ============================================================
// 빠른 지급 토글 (테이블 행에서)
// ============================================================
export function PaidToggle({
  contractId,
  paid,
}: {
  contractId: number;
  paid: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      await markContractPaidAction(contractId, !paid);
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`inline-block px-2 py-0.5 text-xs rounded transition ${
        paid
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
      } ${pending ? "opacity-50" : ""}`}
      title="클릭으로 지급 상태 토글"
    >
      {paid ? "✓ 지급 완료" : "● 지급 예정"}
    </button>
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
