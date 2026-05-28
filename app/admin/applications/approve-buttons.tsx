"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOnboardingStageAction } from "./actions";

type Stage = "applied" | "paid" | "completed" | "partner" | "rejected";

type Props = {
  applicationId: string;
  applicantName: string;
  stage: Stage;
};

export function ApproveButtons({ applicationId, applicantName, stage }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<
    | { stage: string; email?: string; alreadyLoggedIn?: boolean }
    | null
  >(null);
  const [payOpen, setPayOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  // 클릭 즉시 이 행만 반영 (서버 재검증 전 낙관적 표시 — 다른 행과 절대 안 섞임)
  const [optimisticStage, setOptimisticStage] = useState<Stage | null>(null);
  const shownStage = optimisticStage ?? stage;

  const run = (
    toStage: Stage,
    payload?: { paidAmount?: number; paidAt?: string; completedAt?: string; reason?: string }
  ) => {
    setError(null);
    setOptimisticStage(toStage);
    startTransition(async () => {
      const r = await updateOnboardingStageAction(applicationId, toStage, payload);
      if ("error" in r) {
        setError(r.error);
        setOptimisticStage(null); // 실패 시 원복
      } else {
        setPayOpen(false);
        setDoneOpen(false);
        if (toStage === "partner") setSuccess({ stage: "partner", email: r.email, alreadyLoggedIn: r.alreadyLoggedIn });
      }
    });
  };

  const onReject = () => {
    const reason = prompt(`${applicantName}님을 거절/이탈 처리하는 사유 (선택)`);
    if (reason === null) return;
    run("rejected", { reason });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {shownStage === "applied" ? (
          <Button size="sm" onClick={() => setPayOpen(true)} disabled={pending} className="text-xs">
            💳 결제 확인
          </Button>
        ) : null}
        {shownStage === "paid" ? (
          <Button size="sm" onClick={() => setDoneOpen(true)} disabled={pending} className="text-xs">
            🎓 교육 이수 처리
          </Button>
        ) : null}
        {shownStage === "completed" ? (
          <Button
            size="sm"
            onClick={() => {
              if (confirm(`${applicantName}님을 파트너 HVP로 등록할까요?`)) run("partner");
            }}
            disabled={pending}
            className="text-xs"
          >
            🤝 파트너 등록 (HVP)
          </Button>
        ) : null}
        {shownStage === "partner" ? (
          <span className="text-xs text-emerald-700 font-medium px-2 py-1">✓ 파트너 활동 중</span>
        ) : null}
        {shownStage === "rejected" ? (
          <span className="text-xs text-zinc-400 px-2 py-1">거절/이탈</span>
        ) : null}

        {shownStage !== "partner" && shownStage !== "rejected" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={pending}
            className="text-xs text-rose-600 hover:bg-rose-50"
          >
            거절
          </Button>
        ) : null}
        {shownStage === "rejected" ? (
          <Button size="sm" variant="outline" onClick={() => run("applied")} disabled={pending} className="text-xs">
            신청으로 되돌리기
          </Button>
        ) : null}
      </div>

      {/* 단계 수동 변경 (아무 단계로나 이동) */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-400">단계 수동:</span>
        <select
          value={shownStage}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as Stage;
            if (next === shownStage) return;
            if (next === "partner" && !confirm(`${applicantName}님을 파트너 HVP로 등록할까요?`)) return;
            run(next);
          }}
          className="text-[11px] border border-zinc-200 rounded-md px-1.5 py-1 bg-white"
        >
          <option value="applied">신청</option>
          <option value="paid">결제 완료</option>
          <option value="completed">교육 이수</option>
          <option value="partner">파트너 등록</option>
          <option value="rejected">거절/이탈</option>
        </select>
      </div>

      {/* 결제 입력 */}
      {payOpen ? (
        <form
          action={(fd) =>
            run("paid", {
              paidAmount: Number(fd.get("paid_amount")) || 150,
              paidAt: String(fd.get("paid_at") || ""),
            })
          }
          className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-zinc-500 mb-0.5 block">결제 금액 (만원)</Label>
              <Input name="paid_amount" type="number" defaultValue={150} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] text-zinc-500 mb-0.5 block">결제일</Label>
              <Input
                name="paid_at"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button type="submit" size="sm" disabled={pending} className="text-xs h-7 flex-1">
              {pending ? "처리 중..." : "결제 완료 처리"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPayOpen(false)} className="text-xs h-7">
              취소
            </Button>
          </div>
        </form>
      ) : null}

      {/* 교육 이수일 입력 */}
      {doneOpen ? (
        <form
          action={(fd) => run("completed", { completedAt: String(fd.get("completed_at") || "") })}
          className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2"
        >
          <div>
            <Label className="text-[10px] text-zinc-500 mb-0.5 block">교육 이수일</Label>
            <Input
              name="completed_at"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex gap-1.5">
            <Button type="submit" size="sm" disabled={pending} className="text-xs h-7 flex-1">
              {pending ? "처리 중..." : "이수 완료"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setDoneOpen(false)} className="text-xs h-7">
              취소
            </Button>
          </div>
        </form>
      ) : null}

      {success?.stage === "partner" ? (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900">
          ✅ 파트너 HVP 등록 완료!{" "}
          {success.alreadyLoggedIn
            ? "기존 로그인 계정이 HVP로 승격됐어요."
            : "본인 Google 계정(신청 이메일)으로 로그인하면 자동 연결됩니다."}
        </div>
      ) : null}

      {error ? (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">{error}</div>
      ) : null}
    </div>
  );
}
