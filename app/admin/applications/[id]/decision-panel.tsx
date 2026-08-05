"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, FileQuestion, XCircle, Send, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import type { ApplicationStatus } from "@/lib/mock-applications";

type Decision = "go" | "conditional" | "more_docs" | "no_go";

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
    key: "conditional",
    label: "조건부 GO",
    desc: "특정 자료·조건 충족 시",
    icon: AlertCircle,
    color: "#1E40AF",
    bg: "#DBEAFE",
    border: "#3B82F6",
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

const EMAIL_TEMPLATE: Record<Decision, { subject: string; body: string }> = {
  go: {
    subject: "[하임벤처투자] 프로젝트 진행 확정 안내",
    body: `안녕하세요, 하임벤처투자입니다.

제출해주신 신청서 검토 결과, 함께 프로젝트를 진행하기로 결정했습니다.

아래 링크에서 첫 미팅 일정을 잡아주세요:
[Google Calendar 예약 링크]

문의: admin@heimvi.com`,
  },
  conditional: {
    subject: "[하임벤처투자] 조건부 진행 안내",
    body: `안녕하세요, 하임벤처투자입니다.

제출해주신 신청서를 검토했습니다. 아래 조건 충족 시 진행 가능합니다:

- [조건 1]
- [조건 2]

조건 충족 후 회신 부탁드립니다.`,
  },
  more_docs: {
    subject: "[하임벤처투자] 추가 자료 요청",
    body: `안녕하세요, 하임벤처투자입니다.

제출해주신 자료 외에 아래 자료를 추가로 확인이 필요합니다:

- [자료 1]
- [자료 2]

준비되시면 회신 이메일로 첨부 부탁드립니다.`,
  },
  no_go: {
    subject: "",
    body: "(NO-GO는 신청자에게 이메일이 발송되지 않습니다. 사유는 내부 기록으로만 남습니다.)",
  },
};

export function DecisionPanel({
  initialStatus,
  initialNotes,
}: {
  initialStatus: ApplicationStatus;
  initialNotes: string;
}) {
  const [decision, setDecision] = useState<Decision | null>(
    initialStatus === "go" || initialStatus === "conditional" || initialStatus === "more_docs" || initialStatus === "no_go"
      ? initialStatus
      : null
  );
  const [notes, setNotes] = useState(initialNotes);
  const [showEmail, setShowEmail] = useState(false);

  const activeDecision = decision ? DECISIONS.find((d) => d.key === decision) : null;
  const emailTemplate = decision ? EMAIL_TEMPLATE[decision] : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <span className="w-4 h-4 rounded-full bg-brand" />
        <h3 className="text-[13px] font-semibold text-zinc-900">검토 결정</h3>
      </div>

      {/* 4 decision buttons */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {DECISIONS.map((d) => {
          const active = decision === d.key;
          const Icon = d.icon;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setDecision(d.key)}
              className={`text-left px-3.5 py-3 rounded-lg transition-all border ${
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
          rows={4}
          placeholder={
            decision === "conditional"
              ? "예: MFDS 인증 로드맵 확인 후 착수. 유닛 이코노믹스 자료 보완 필요."
              : decision === "more_docs"
              ? "예: 최근 3개월 매출 데이터, 주주명부 재제출 요청."
              : decision === "no_go"
              ? "예: 서비스 라인업 부적합. 트랙션 확보 후 재접수 안내."
              : "결정 근거·조건·후속 조치를 정리해주세요."
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

      {/* Submit */}
      <button
        type="button"
        disabled={!decision}
        onClick={() => alert("MOCK 화면입니다. 실제 저장·이메일 발송은 Phase 1c 완성 후.")}
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg text-[13.5px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: activeDecision?.border ?? "#71717A",
          boxShadow: activeDecision
            ? `0 4px 14px ${activeDecision.border}30`
            : "none",
        }}
      >
        <Send className="w-3.5 h-3.5" />
        {decision === "no_go"
          ? "NO-GO 확정 (이메일 없음)"
          : decision === "more_docs"
          ? "자료 요청 이메일 발송"
          : decision === "conditional"
          ? "조건부 GO · 이메일 발송"
          : decision === "go"
          ? "GO 확정 · 캘린더 링크 발송"
          : "결정 선택 후 저장"}
      </button>
    </div>
  );
}
