"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Check } from "lucide-react";
import { assignReviewerAction } from "./actions";
import type { Reviewer } from "@/lib/applications";

export function AssigneePicker({
  applicationId,
  reviewers,
  currentReviewerId,
  currentReviewerName,
}: {
  applicationId: string;
  reviewers: Reviewer[];
  currentReviewerId: string | null;
  currentReviewerName: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentReviewerId ?? "");
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = selected !== (currentReviewerId ?? "");

  function handleSave() {
    setErrorMsg(null);
    setJustSaved(false);
    const reviewerId = selected === "" ? null : selected;
    startTransition(async () => {
      const res = await assignReviewerAction(applicationId, reviewerId);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      setJustSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <UserCog className="w-4 h-4 text-zinc-400" />
        <h3 className="text-[13px] font-semibold text-zinc-900">담당자 배정</h3>
        {currentReviewerName ? (
          <span className="ml-auto text-[11px] text-zinc-500">
            현재: <b className="text-zinc-900">{currentReviewerName}</b>
          </span>
        ) : (
          <span className="ml-auto text-[11px] text-zinc-400">미배정</span>
        )}
      </div>

      <label className="text-[11.5px] font-medium text-zinc-600 mb-1.5 block">
        담당 심사역 선택
      </label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={pending}
        className="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)]"
      >
        <option value="">— 미배정 —</option>
        {reviewers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} · {r.email}
          </option>
        ))}
      </select>

      {reviewers.length === 0 ? (
        <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
          등록된 심사역이 없습니다. heimvi.com Google 계정으로 한 번씩 로그인하면 자동 등록됩니다.
        </p>
      ) : null}

      {errorMsg ? (
        <div className="mt-3 px-3 py-2 rounded-md bg-rose-50 border border-rose-200 text-[12px] text-rose-700">
          {errorMsg}
        </div>
      ) : null}
      {justSaved && !errorMsg ? (
        <div className="mt-3 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 inline-flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> 배정됨
        </div>
      ) : null}

      <button
        type="button"
        disabled={!dirty || pending}
        onClick={handleSave}
        className="mt-4 w-full h-9 rounded-lg text-[12.5px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "저장 중..." : dirty ? "담당자 저장" : "변경사항 없음"}
      </button>
    </div>
  );
}
