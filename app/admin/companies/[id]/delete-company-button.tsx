"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { hardDeleteCompanyAction } from "./actions";

/**
 * 기업 완전 삭제 — 확인용 이름 재입력 필요.
 * 클릭 → 모달 → 이름 타이핑 → 삭제 실행 → /admin/pipeline 으로 이동.
 */
export function DeleteCompanyButton({
  companyId,
  companyName,
}: {
  companyId: number;
  companyName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nameMatches = confirmName.trim() === companyName;

  const submit = () => {
    if (!nameMatches) {
      setError("기업 이름이 일치하지 않습니다.");
      return;
    }
    setError(null);
    start(async () => {
      const res = await hardDeleteCompanyAction(companyId, confirmName.trim());
      if (res.error) {
        setError(res.error);
        return;
      }
      // 삭제 성공 → 파이프라인으로
      router.push("/admin/pipeline");
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 text-rose-600 text-[12px] font-medium hover:bg-rose-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        기업 완전 삭제
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">
                  기업을 완전 삭제하시겠습니까?
                </h3>
                <p className="text-[12.5px] text-zinc-500 leading-relaxed">
                  <b className="text-zinc-900">{companyName}</b> 및 관련된 모든
                  미팅·자료·업무 이력이 DB 에서 영구 제거됩니다. <b className="text-rose-600">되돌릴 수 없습니다.</b>
                </p>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-[12px] text-zinc-600 block mb-1.5">
                확인을 위해 기업명 <b className="text-zinc-900">{companyName}</b> 을(를) 그대로 입력하세요.
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => {
                  setConfirmName(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nameMatches) submit();
                  else if (e.key === "Escape") setOpen(false);
                }}
                disabled={pending}
                autoFocus
                placeholder={companyName}
                className="w-full h-9 px-3 rounded-md border border-zinc-300 text-[13px] focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {error ? (
              <div className="text-[11.5px] text-rose-600 mb-3">{error}</div>
            ) : null}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1 h-9 rounded-md border border-zinc-300 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !nameMatches}
                className="flex-1 h-9 rounded-md bg-rose-600 text-white text-[13px] font-medium hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? "삭제 중..." : "영구 삭제"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
