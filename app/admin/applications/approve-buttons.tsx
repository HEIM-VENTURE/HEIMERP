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
    | { type: "success"; email: string; name: string; alreadyLoggedIn: boolean }
    | { type: "error"; message: string }
    | null
  >(null);

  const onApprove = () => {
    if (!confirm(`${applicantName}님을 HVP로 승인하시겠어요?`)) return;

    startTransition(async () => {
      const r = await approveApplicationAction(applicationId);
      if (r.success) {
        setResult({
          type: "success",
          email: r.email!,
          name: r.name!,
          alreadyLoggedIn: !!r.alreadyLoggedIn,
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
          {pending ? "처리 중..." : "✓ 승인 (HVP 등록)"}
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
          <div className="font-semibold text-emerald-900 mb-1">✅ HVP 승인·등록 완료!</div>
          <div className="text-emerald-800 space-y-0.5">
            <div>이름: {result.name}</div>
            <div>이메일: <span className="font-mono">{result.email}</span></div>
          </div>
          {result.alreadyLoggedIn ? (
            <div className="mt-2 text-emerald-700 text-[11px]">
              이미 로그인한 계정이 있어 바로 HVP 권한으로 승격됐어요. 재로그인하면 HVP 화면이 보입니다.
            </div>
          ) : (
            <div className="mt-2 text-blue-700 text-[11px] bg-blue-50 border border-blue-100 rounded p-2">
              📣 HVP에게 안내: <b>위 이메일의 본인 Google 계정</b>으로
              heimventure.netlify.app 에서 <b>&quot;Google로 로그인&quot;</b> 하면
              자동으로 HVP 권한이 부여됩니다. (별도 비밀번호 없음)
            </div>
          )}
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
