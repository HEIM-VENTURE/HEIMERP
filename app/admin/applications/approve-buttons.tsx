"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveApplicationAction, rejectApplicationAction } from "./actions";

type Props = {
  applicationId: string;
  applicantName: string;
};

export function ApproveButtons({ applicationId, applicantName }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { type: "success"; email: string; tempPassword: string; name: string }
    | { type: "error"; message: string }
    | null
  >(null);

  const onApprove = () => {
    if (!confirm(`${applicantName}님을 승인하고 HVP 계정을 생성하시겠어요?`)) return;

    startTransition(async () => {
      const r = await approveApplicationAction(applicationId);
      if (r.success) {
        setResult({
          type: "success",
          email: r.email!,
          tempPassword: r.tempPassword!,
          name: r.name!,
        });
      } else {
        setResult({ type: "error", message: r.error ?? "알 수 없는 오류" });
      }
    });
  };

  const onReject = () => {
    const reason = prompt(`${applicantName}님을 거절하는 사유를 입력하세요 (선택)`);
    if (reason === null) return; // 취소

    startTransition(async () => {
      const r = await rejectApplicationAction(applicationId, reason);
      if (!r.success) {
        setResult({ type: "error", message: r.error ?? "알 수 없는 오류" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" onClick={onApprove} disabled={pending} className="text-xs">
          {pending ? "처리 중..." : "✓ 승인 + 계정 생성"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={pending}
          className="text-xs text-rose-600 hover:bg-rose-50"
        >
          거절
        </Button>
      </div>

      {result?.type === "success" ? (
        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
          <div className="font-semibold text-emerald-900 mb-1">✅ 승인 완료!</div>
          <div className="text-emerald-800 space-y-0.5">
            <div>이름: {result.name}</div>
            <div>로그인 이메일: <span className="font-mono">{result.email}</span></div>
            <div>임시 비밀번호: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{result.tempPassword}</span></div>
          </div>
          <div className="mt-2 text-amber-700 text-[11px]">
            ⚠️ 이 비밀번호를 HVP에게 안내해주세요. 다시 확인 불가합니다.
          </div>
        </div>
      ) : null}

      {result?.type === "error" ? (
        <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
          {result.message}
        </div>
      ) : null}
    </div>
  );
}
