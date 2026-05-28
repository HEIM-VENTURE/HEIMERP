"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  SALES_STAGE_LABELS,
  SALES_STAGES_ORDER,
  CONSULTING_STAGE_LABELS,
  CONSULTING_STAGES_ORDER,
} from "@/lib/labels";
import {
  changeSalesStageAction,
  changeConsultingStageAction,
  dropCompanyAction,
  restoreCompanyAction,
} from "./actions";

type Props = {
  companyId: number;
  currentSalesStage: keyof typeof SALES_STAGE_LABELS;
  currentConsultingStage: keyof typeof CONSULTING_STAGE_LABELS | null;
  currentDropReason?: string | null;
};

export function StageChanger({
  companyId,
  currentSalesStage,
  currentConsultingStage,
  currentDropReason,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const drop = () => {
    const reason = prompt("드랍/중단 사유를 입력하세요 (예: 단계 미진행, 연락 두절, 부적합)");
    if (reason === null) return;
    setError(null);
    startTransition(async () => {
      const r = await dropCompanyAction(companyId, reason);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  const restore = () => {
    if (!confirm("드랍을 취소하고 다시 진행 상태로 되돌릴까요?")) return;
    setError(null);
    startTransition(async () => {
      const r = await restoreCompanyAction(companyId);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  const changeSales = (newStage: string) => {
    if (newStage === currentSalesStage) return;
    if (!confirm(`영업 단계를 "${SALES_STAGE_LABELS[newStage as keyof typeof SALES_STAGE_LABELS]}"로 변경하시겠어요?\n(자동 To-do가 생성됩니다)`)) return;
    setError(null);
    startTransition(async () => {
      const r = await changeSalesStageAction(companyId, newStage);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  const changeConsulting = (newStage: string | null) => {
    if (newStage === currentConsultingStage) return;
    const label = newStage ? CONSULTING_STAGE_LABELS[newStage as keyof typeof CONSULTING_STAGE_LABELS] : "(없음)";
    if (!confirm(`컨설팅 단계를 "${label}"로 변경하시겠어요?`)) return;
    setError(null);
    startTransition(async () => {
      const r = await changeConsultingStageAction(companyId, newStage);
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={pending}>
        단계 변경 ▾
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">단계 변경</h3>
                <p className="text-xs text-zinc-500 mt-1">변경 시 자동 To-do가 생성되고 활동 피드에 기록됩니다</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-900 text-xl leading-none">
                ×
              </button>
            </div>

            {/* 영업 단계 */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-2">
                📋 영업 단계
                <span className="text-zinc-400 font-normal">
                  현재: {SALES_STAGE_LABELS[currentSalesStage]}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {SALES_STAGES_ORDER.map((s) => {
                  const active = s === currentSalesStage;
                  return (
                    <button
                      key={s}
                      onClick={() => changeSales(s)}
                      disabled={pending || active}
                      className={`px-2 py-2 text-xs rounded-lg border transition ${
                        active
                          ? "bg-zinc-900 text-white border-zinc-900 cursor-default"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-400"
                      }`}
                    >
                      {SALES_STAGE_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 컨설팅 단계 (착수된 경우만) */}
            {currentSalesStage === "kickoff" ? (
              <div className="mb-5">
                <div className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-2">
                  💼 컨설팅 단계
                  <span className="text-zinc-400 font-normal">
                    현재: {currentConsultingStage ? CONSULTING_STAGE_LABELS[currentConsultingStage] : "(미지정)"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CONSULTING_STAGES_ORDER.map((s) => {
                    const active = s === currentConsultingStage;
                    return (
                      <button
                        key={s}
                        onClick={() => changeConsulting(s)}
                        disabled={pending || active}
                        className={`px-2 py-2 text-[11px] rounded-lg border transition leading-tight ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600 cursor-default"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-400"
                        }`}
                      >
                        {CONSULTING_STAGE_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-5 p-3 bg-zinc-50 rounded-lg text-xs text-zinc-500">
                💡 영업 단계를 &quot;착수&quot;로 변경하면 컨설팅 단계도 선택할 수 있습니다.
              </div>
            )}

            {/* 드랍/복구 */}
            <div className="mb-4 p-3 rounded-lg border border-zinc-200 bg-zinc-50">
              {currentDropReason ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-rose-700">
                    ⛔ 드랍됨 — <span className="font-medium">{currentDropReason}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={restore} disabled={pending} className="text-xs">
                    드랍 취소 (복구)
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-500">
                    미팅까지 안 가는 기업은 드랍 처리 — 파이프라인에서 숨겨집니다
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={drop}
                    disabled={pending}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    드랍/중단
                  </Button>
                </div>
              )}
            </div>

            {error ? (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2 mb-3">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-zinc-100">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
