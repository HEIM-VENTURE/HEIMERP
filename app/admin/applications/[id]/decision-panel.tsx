"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileQuestion, XCircle, Send, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import type { ApplicationStatus } from "@/lib/mock-applications";
import { saveDecisionAction } from "./actions";

type Decision = "go" | "more_docs" | "no_go";

const DECISIONS: {
  key: Decision;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    key: "go",
    label: "GO",
    desc: "프로젝트 진행 승인",
    icon: CheckCircle2,
    color: "#065F46",
    bg: "#D1FAE5",
    border: "#10B981",
  },
  {
    key: "more_docs",
    label: "자료 요청",
    desc: "판단에 필요한 자료 부족",
    icon: FileQuestion,
    color: "#A83A20",
    bg: "#FBEAE5",
    border: "#E5531F",
  },
  {
    key: "no_go",
    label: "NO-GO",
    desc: "진행 부적합",
    icon: XCircle,
    color: "#4B5563",
    bg: "#F3F4F6",
    border: "#9CA3AF",
  },
];

// 실제 발송 문구는 apps-script/decision-mailer.gs에서 조립된다. 이 상수는 검토 결정 카드의 미리보기 용도.
const EMAIL_TEMPLATE: Record<Decision, { subject: string; body: string }> = {
  go: {
    subject: "[하임벤처투자] {기업명} 님, 초도 미팅 · 기업 진단 안내",
    body: `안녕하세요, {기업명} {담당자명}님.
하임벤처투자입니다.

제출해주신 신청서를 잘 검토했습니다.

초도 미팅 일정을 잡고, 미팅에서 기업 진단을 진행하고자 합니다.
아래 링크에서 편하신 시간을 선택해주세요.

https://calendar.app.google/rPKpB6m3Bc7SPdjY8

미팅에서 뵙겠습니다.

(검토 의견 입력 시 여기에 함께 나감)

접수번호: {접수번호}

————————————
하임벤처투자
문의: hello@heimvi.com | 02-2038-4118`,
  },
  more_docs: {
    subject: "[하임벤처투자] {기업명} 님, 추가 자료 요청",
    body: `안녕하세요, {기업명} {담당자명}님.
하임벤처투자입니다.

제출해주신 신청서를 검토했습니다. 판단을 위해 아래 자료가 추가로 필요합니다.

(검토 의견 칸에 쓰신 내용이 여기에 그대로 들어갑니다)

준비되시면 이 이메일에 회신으로 첨부 부탁드립니다.

접수번호: {접수번호}

————————————
하임벤처투자
문의: hello@heimvi.com | 02-2038-4118`,
  },
  no_go: {
    subject: "",
    body: "(NO-GO는 신청자에게 이메일이 발송되지 않습니다. 사유는 내부 기록으로만 남습니다.)",
  },
};

export function DecisionPanel({
  applicationId,
  initialStatus,
  initialNotes,
  canEdit = true,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
  initialNotes: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(
    initialStatus === "go" || initialStatus === "more_docs" || initialStatus === "no_go"
      ? initialStatus
      : null
  );
  const [notes, setNotes] = useState(initialNotes);
  const [showEmail, setShowEmail] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [alreadySent, setAlreadySent] = useState(false);

  const activeDecision = decision ? DECISIONS.find((d) => d.key === decision) : null;
  const emailTemplate = decision ? EMAIL_TEMPLATE[decision] : null;

  function handleSubmit() {
    if (!decision) return;
    if (!canEdit) {
      setErrorMsg("이 신청은 편집 권한이 없습니다.");
      return;
    }
    if (decision === "more_docs" && !notes.trim()) {
      setErrorMsg("자료 요청은 검토 의견에 요청 자료를 명시해주세요. (이메일 본문으로 그대로 발송됩니다)");
      return;
    }
    if (decision === "no_go" && !confirm("NO-GO로 확정하면 목록에서 숨겨집니다. 진행할까요?")) {
      return;
    }
    setErrorMsg(null);
    setAlreadySent(false);
    startTransition(async () => {
      const res = await saveDecisionAction(applicationId, decision, notes);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      setSavedAt(new Date());
      setAlreadySent(res.alreadySent);
      // NO-GO는 목록으로 돌아가는 편이 자연스러움
      if (decision === "no_go") {
        router.push("/admin/applications");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <span className="w-4 h-4 rounded-full bg-brand" />
        <h3 className="text-[13px] font-semibold text-zinc-900">검토 결정</h3>
      </div>

      {/* 3 decision buttons (GO / 자료요청 / NO-GO) */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {DECISIONS.map((d) => {
          const active = decision === d.key;
          const Icon = d.icon;
          return (
            <button
              key={d.key}
              type="button"
              disabled={!canEdit}
              onClick={() => setDecision(d.key)}
              className={`text-left px-3.5 py-3 rounded-lg transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                active ? "border-2" : "border hover:bg-zinc-50"
              }`}
              style={
                active
                  ? { borderColor: d.border, background: d.bg }
                  : { borderColor: "#E5E7EB" }
              }
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Icon className="w-3.5 h-3.5" style={{ color: active ? d.color : "#71717A" }} />
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: active ? d.color : "#3F3F46" }}
                >
                  {d.label}
                </span>
              </div>
              <div className="text-[11px]" style={{ color: active ? d.color : "#71717A", opacity: 0.85 }}>
                {d.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="text-[11.5px] font-medium text-zinc-600 mb-1.5 block">
          검토 의견 · 결정 사유
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!canEdit}
          rows={4}
          placeholder={
            decision === "more_docs"
              ? "예: 최근 3개월 매출 데이터, 주주명부 재제출 요청."
              : decision === "no_go"
              ? "예: 서비스 라인업 부적합. 트랙션 확보 후 재접수 안내."
              : decision === "go"
              ? "예: 진행 조건·후속 미팅 안건·담당 배정 등을 정리해주세요."
              : "결정 근거·후속 조치를 정리해주세요."
          }
          className="w-full px-3 py-2.5 rounded-lg text-[13px] leading-relaxed bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)] resize-none placeholder:text-zinc-400"
        />
      </div>

      {/* Email preview toggle */}
      {decision && emailTemplate ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowEmail(!showEmail)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-zinc-50 hover:bg-zinc-100 text-[12px] text-zinc-700 transition-colors"
          >
            <span>
              {decision === "no_go" ? "신청자에게 이메일 발송되지 않음" : "이메일 미리보기"}
            </span>
            {showEmail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showEmail ? (
            <div className="mt-2 px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-100 text-[12.5px]">
              {emailTemplate.subject ? (
                <>
                  <div className="pb-2 mb-2.5 border-b border-zinc-200">
                    <div className="text-[10.5px] font-medium uppercase text-zinc-500 mb-0.5">
                      제목
                    </div>
                    <div className="text-zinc-900 font-medium">{emailTemplate.subject}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-medium uppercase text-zinc-500 mb-1">
                      본문
                    </div>
                    <div className="text-zinc-800 whitespace-pre-line leading-relaxed">
                      {emailTemplate.body}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-zinc-500 whitespace-pre-line">{emailTemplate.body}</div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Error / Saved 알림 */}
      {errorMsg ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 border border-rose-200 text-[12px] text-rose-700 leading-relaxed">
          {errorMsg}
        </div>
      ) : null}
      {savedAt && !errorMsg ? (
        <div className="mb-3 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 leading-relaxed">
          저장됨 · {savedAt.toLocaleTimeString("ko-KR")}
          {decision === "no_go"
            ? ""
            : alreadySent
            ? " · 이미 발송된 판정이라 이메일은 재발송하지 않습니다"
            : " · 이메일은 곧 자동 발송됩니다"}
        </div>
      ) : null}

      {/* Submit */}
      <button
        type="button"
        disabled={!decision || pending || !canEdit}
        onClick={handleSubmit}
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg text-[13.5px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: activeDecision?.border ?? "#71717A",
          boxShadow: activeDecision
            ? `0 4px 14px ${activeDecision.border}30`
            : "none",
        }}
      >
        <Send className="w-3.5 h-3.5" />
        {pending
          ? "저장 중..."
          : decision === "no_go"
          ? "NO-GO 확정 · 목록에서 숨김"
          : decision === "more_docs"
          ? "자료 요청 저장 · 이메일 큐 등록"
          : decision === "go"
          ? "GO 확정 · 이메일 큐 등록"
          : "결정 선택 후 저장"}
      </button>
    </div>
  );
}
