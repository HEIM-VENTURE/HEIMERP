"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ClipboardList } from "lucide-react";
import {
  TextEditCell,
  PaidToggleCell,
  UrgencySelectCell,
  ProgramCheckCell,
  statusBadge,
} from "@/app/admin/paid-customers/edit-cells";
import { createPaidCustomer } from "@/app/admin/paid-customers/actions";

/** 고객 현황표(paid_customers) 행을 기업 상세에서 바로 보고 고치는 카드 */
export type PaidRow = {
  id: string;
  is_paid: boolean | null;
  urgency: number | null;
  target_program: string | null;
  new_corp_setup: string | null;
  new_company_name: string | null;
  ir_deck_tips: string | null;
  ir_deck_lips: string | null;
  demoday_1_a: string | null;
  demoday_1_b: string | null;
  demoday_2_a: string | null;
  demoday_2_b: string | null;
  offline: string | null;
  memo: string | null;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 min-h-[26px]">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

export function PaidStatusCard({
  companyId,
  companyName,
  row,
}: {
  companyId: number;
  companyName: string;
  row: PaidRow | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!row) {
    return (
      <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-brand" /> 결제·진행 현황
        </h3>
        <p className="text-[11.5px] text-zinc-500 mt-1.5">아직 결제·진행 현황이 없는 기업입니다.</p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await createPaidCustomer(companyName, companyId);
              if (!res.ok) toast.error(res.error);
              else router.refresh();
            })
          }
          className="mt-3 inline-flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> 현황 추가
        </button>
      </div>
    );
  }

  const text = (field: keyof PaidRow & string, value: string | null, placeholder = "-") => (
    <TextEditCell
      id={row.id}
      field={field as never}
      value={value}
      placeholder={placeholder}
      render={statusBadge}
    />
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-brand" /> 결제·진행 현황
        </h3>
        <span className="text-[10px] text-zinc-400">셀 클릭 → 편집</span>
      </div>
      <div className="space-y-1 text-xs">
        <Row label="결제">
          <PaidToggleCell id={row.id} value={row.is_paid} />
        </Row>
        <Row label="긴급도">
          <UrgencySelectCell id={row.id} value={row.urgency} />
        </Row>
        <Row label="타깃 프로그램">
          <div className="inline-flex gap-1">
            <ProgramCheckCell id={row.id} kind="팁스" value={row.target_program} />
            <ProgramCheckCell id={row.id} kind="립스" value={row.target_program} />
            <ProgramCheckCell id={row.id} kind="투자" value={row.target_program} />
          </div>
        </Row>
        <Row label="신규법인">{text("new_corp_setup", row.new_corp_setup)}</Row>
        {row.new_corp_setup || row.new_company_name ? (
          <Row label="신규 법인명">{text("new_company_name", row.new_company_name)}</Row>
        ) : null}
        <Row label="IR Deck (TIPS)">{text("ir_deck_tips", row.ir_deck_tips)}</Row>
        <Row label="IR Deck (LIPS)">{text("ir_deck_lips", row.ir_deck_lips)}</Row>
        <Row label="데모데이 1차">
          <div className="inline-flex gap-2">
            {text("demoday_1_a", row.demoday_1_a)}
            {text("demoday_1_b", row.demoday_1_b)}
          </div>
        </Row>
        <Row label="데모데이 2차">
          <div className="inline-flex gap-2">
            {text("demoday_2_a", row.demoday_2_a)}
            {text("demoday_2_b", row.demoday_2_b)}
          </div>
        </Row>
        <Row label="오프라인">{text("offline", row.offline)}</Row>
        <div className="pt-2">
          <div className="text-zinc-500 mb-1">메모</div>
          <TextEditCell
            id={row.id}
            field="memo"
            value={row.memo}
            placeholder="메모 추가"
            multiline
            render={(v) =>
              v ? <span className="whitespace-pre-wrap text-zinc-800">{v}</span> : <span className="text-zinc-300">메모 추가</span>
            }
          />
        </div>
      </div>
    </div>
  );
}
