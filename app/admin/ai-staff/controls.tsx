"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Undo2, Send } from "lucide-react";
import {
  resolvePostAction,
  revertChangeAction,
  createRequestAction,
  cancelRequestAction,
} from "./actions";

export function PostButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const run = (status: "done" | "dismissed") =>
    start(async () => {
      const res = await resolvePostAction(id, status);
      if (res.error) toast.error(res.error);
    });
  return (
    <div className="flex gap-1 shrink-0">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("done")}
        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
      >
        <Check className="w-3 h-3" /> 처리함
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("dismissed")}
        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
      >
        <X className="w-3 h-3" /> 무시
      </button>
    </div>
  );
}

export function RevertButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("이 변경을 되돌릴까요?")) return;
        start(async () => {
          const res = await revertChangeAction(id);
          if (res.error) toast.error(res.error);
          else toast.success("되돌렸습니다");
        });
      }}
      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 shrink-0"
    >
      <Undo2 className="w-3 h-3" /> {pending ? "되돌리는 중" : "되돌리기"}
    </button>
  );
}

export function RequestForm() {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const submit = () =>
    start(async () => {
      const res = await createRequestAction(text);
      if (res.error) toast.error(res.error);
      else {
        setText("");
        toast.success("요청을 남겼습니다. AI 직원이 다음 근무 때 확인합니다.");
      }
    });
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="예: 사이드바에서 '계약' 메뉴 빼주세요 / 기업 마스터 표에 PM 열 추가해주세요"
        className="w-full text-[13px] rounded-lg border border-zinc-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={pending || !text.trim()}
          onClick={submit}
          className="inline-flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-lg bg-brand text-white hover:opacity-90 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> 요청 남기기
        </button>
      </div>
    </div>
  );
}

export function CancelRequestButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await cancelRequestAction(id);
          if (res.error) toast.error(res.error);
        })
      }
      className="text-[11px] text-zinc-400 hover:text-rose-600 disabled:opacity-50 shrink-0"
    >
      취소
    </button>
  );
}
