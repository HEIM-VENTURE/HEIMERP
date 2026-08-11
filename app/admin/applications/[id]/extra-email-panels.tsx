"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Video, Mail, Check } from "lucide-react";
import { sendMeetingInfoAction, sendCustomEmailAction } from "./actions";

// ═════════════════════════════════════════════
// 미팅 안내 이메일 발송 (고정 템플릿, 원클릭)
// ═════════════════════════════════════════════
export function MeetingInfoPanel({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSend() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await sendMeetingInfoAction(applicationId);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      setSentAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <Video className="w-4 h-4 text-zinc-400" />
        <h3 className="text-[13px] font-semibold text-zinc-900">미팅 안내 이메일</h3>
        <span className="ml-auto text-[11px] text-zinc-400">Zoom · 1시간 · 고정 문구</span>
      </div>

      <p className="text-[12px] text-zinc-600 leading-relaxed mb-4">
        미팅 일정 확정 후 발송하는 안내 메일입니다. 클릭 즉시 신청자에게 발송됩니다.
        (Zoom 링크는 이메일에 포함되지 않으며, &quot;별도 전달드립니다&quot;로 안내됩니다)
      </p>

      {errorMsg ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 border border-rose-200 text-[12px] text-rose-700">
          {errorMsg}
        </div>
      ) : null}
      {sentAt && !errorMsg ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 inline-flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> 발송 완료 · {sentAt.toLocaleTimeString("ko-KR")}
        </div>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={handleSend}
        className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="w-3.5 h-3.5" />
        {pending ? "발송 중..." : "미팅 안내 이메일 발송"}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════
// 추가 메일 발송 (자유 입력)
// ═════════════════════════════════════════════
export function CustomEmailPanel({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !pending;

  function handleSend() {
    if (!canSend) return;
    if (!confirm("입력하신 제목·본문으로 지금 이메일을 발송할까요?")) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await sendCustomEmailAction(applicationId, subject, body);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      setSentAt(new Date());
      setSubject("");
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <Mail className="w-4 h-4 text-zinc-400" />
        <h3 className="text-[13px] font-semibold text-zinc-900">추가 메일 발송</h3>
        <span className="ml-auto text-[11px] text-zinc-400">자유 입력 · 인사말·서명 자동</span>
      </div>

      <div className="mb-3">
        <label className="text-[11.5px] font-medium text-zinc-600 mb-1.5 block">제목</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={pending}
          placeholder="예: 미팅 일정 재조정 요청"
          className="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)] placeholder:text-zinc-400"
        />
      </div>

      <div className="mb-3">
        <label className="text-[11.5px] font-medium text-zinc-600 mb-1.5 block">본문</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
          rows={6}
          placeholder="본문 내용을 입력해주세요. 인사말('안녕하세요...')과 서명(하임벤처투자 · 문의)은 자동으로 붙습니다."
          className="w-full px-3 py-2.5 rounded-lg text-[13px] leading-relaxed bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)] resize-none placeholder:text-zinc-400"
        />
      </div>

      {errorMsg ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 border border-rose-200 text-[12px] text-rose-700">
          {errorMsg}
        </div>
      ) : null}
      {sentAt && !errorMsg ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 inline-flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> 발송 완료 · {sentAt.toLocaleTimeString("ko-KR")}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canSend}
        onClick={handleSend}
        className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="w-3.5 h-3.5" />
        {pending ? "발송 중..." : "추가 메일 발송"}
      </button>
    </div>
  );
}
