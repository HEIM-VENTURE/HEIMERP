"use client";

import { useState } from "react";
import { CheckCircle2, Clock, User, Building2, Send } from "lucide-react";
import type { DemoDay, ScoreDimension } from "@/lib/mock-demoday";
import { SCORE_DIMENSIONS } from "@/lib/mock-demoday";

type ScoreMap = Record<ScoreDimension, number>;

type Draft = {
  scores: Partial<ScoreMap>;
  overall_comment: string;
  strengths: string;
  weaknesses: string;
  followup_interest: "yes" | "maybe" | "no" | null;
};

export function EvaluationForm({ demoday }: { demoday: DemoDay }) {
  const [step, setStep] = useState<"identify" | "evaluate" | "submitted">("identify");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [role, setRole] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [activeStartupId, setActiveStartupId] = useState<string | null>(null);

  const startIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !org.trim()) return;
    setStep("evaluate");
    setActiveStartupId(demoday.startups[0]?.id ?? null);
  };

  const getDraft = (sid: string): Draft =>
    drafts[sid] ?? {
      scores: {},
      overall_comment: "",
      strengths: "",
      weaknesses: "",
      followup_interest: null,
    };

  const updateDraft = (sid: string, patch: Partial<Draft>) => {
    setDrafts((d) => ({ ...d, [sid]: { ...getDraft(sid), ...patch } }));
  };

  const setScore = (sid: string, dim: ScoreDimension, value: number) => {
    const cur = getDraft(sid);
    updateDraft(sid, { scores: { ...cur.scores, [dim]: value } });
  };

  const isStartupComplete = (sid: string): boolean => {
    const d = getDraft(sid);
    const allScored = SCORE_DIMENSIONS.every((dim) => (d.scores[dim.key] ?? 0) > 0);
    return allScored && d.overall_comment.trim().length > 0;
  };

  const completedCount = demoday.startups.filter((s) => isStartupComplete(s.id)).length;
  const allDone = completedCount === demoday.startups.length;

  const submit = () => {
    // Mock — 실제로는 서버로 전송
    alert("평가 제출 완료 (Mock). 실제 저장·이메일 발송은 Phase 2에서 연결됩니다.");
    setStep("submitted");
  };

  // ═══════════ Step 1: Identify ═══════════
  if (step === "identify") {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-6">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-4">
          Step 1 · 심사역 정보
        </div>
        <form onSubmit={startIdentify} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-zinc-800 mb-1.5">
              이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="예: 김성훈"
              className="w-full h-12 px-4 rounded-lg text-[15px] bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-800 mb-1.5">
              소속 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              required
              placeholder="예: 오르빗파트너스 (TIPS 운영사)"
              className="w-full h-12 px-4 rounded-lg text-[15px] bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-800 mb-1.5">
              직책
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="예: 수석 심사역"
              className="w-full h-12 px-4 rounded-lg text-[15px] bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)]"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !org.trim()}
            className="w-full h-12 rounded-xl bg-brand text-white text-[14px] font-semibold hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            평가 시작 →
          </button>
        </form>
      </div>
    );
  }

  // ═══════════ Step 3: Submitted ═══════════
  if (step === "submitted") {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-[20px] font-bold text-zinc-900 mb-2">평가 제출 완료</h2>
        <p className="text-[14px] text-zinc-600 leading-relaxed">
          {name} 심사역님, {demoday.startups.length}개 스타트업 평가 감사드립니다.
          <br />
          결과는 요약된 피드백으로 스타트업 대표에게 전달됩니다.
        </p>
      </div>
    );
  }

  // ═══════════ Step 2: Evaluate ═══════════
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-5">
      {/* Sidebar: startups list */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-3 flex items-center justify-between">
            <span>참여 기업</span>
            <span className="text-zinc-400">
              {completedCount}/{demoday.startups.length}
            </span>
          </div>
          <div className="space-y-1">
            {demoday.startups.map((s, i) => {
              const done = isStartupComplete(s.id);
              const active = activeStartupId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStartupId(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? "bg-brand/10 border border-brand/30"
                      : "hover:bg-zinc-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 ${
                        done
                          ? "bg-emerald-500 text-white"
                          : active
                          ? "bg-brand text-white"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-zinc-900 truncate">
                        {s.company_name}
                      </div>
                      <div className="text-[10.5px] text-zinc-500 truncate">
                        {s.pitch_time}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={submit}
              disabled={!allDone}
              className="w-full h-11 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              전체 평가 제출
            </button>
            {!allDone ? (
              <div className="text-[10.5px] text-zinc-500 text-center mt-2">
                {demoday.startups.length - completedCount}개 기업 평가 남음
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 px-3 text-[11px] text-zinc-500 flex items-center gap-2">
          <User className="w-3 h-3" />
          {name}
          {org ? ` · ${org}` : ""}
        </div>
      </div>

      {/* Main: current startup evaluation */}
      <div>
        {activeStartupId ? (
          <StartupEvaluationCard
            key={activeStartupId}
            startup={demoday.startups.find((s) => s.id === activeStartupId)!}
            draft={getDraft(activeStartupId)}
            onScoreChange={(dim, val) => setScore(activeStartupId, dim, val)}
            onFieldChange={(field, val) => updateDraft(activeStartupId, { [field]: val } as any)}
            onNext={() => {
              const idx = demoday.startups.findIndex((s) => s.id === activeStartupId);
              const next = demoday.startups[idx + 1];
              if (next) setActiveStartupId(next.id);
            }}
            hasNext={demoday.startups.findIndex((s) => s.id === activeStartupId) < demoday.startups.length - 1}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function StartupEvaluationCard({
  startup,
  draft,
  onScoreChange,
  onFieldChange,
  onNext,
  hasNext,
}: {
  startup: DemoDay["startups"][number];
  draft: Draft;
  onScoreChange: (dim: ScoreDimension, val: number) => void;
  onFieldChange: (field: keyof Draft, val: any) => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
      {/* Startup header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-mono text-zinc-500">{startup.pitch_time}</span>
          <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
            {startup.stage}
          </span>
        </div>
        <h2 className="text-[22px] font-bold text-zinc-900 tracking-tight mb-1.5">{startup.company_name}</h2>
        <p className="text-[13.5px] text-zinc-600 leading-relaxed">{startup.tagline}</p>
        {startup.ir_deck_url ? (
          <a
            href={startup.ir_deck_url}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-[12px] text-brand hover:underline mt-2"
          >
            IR Deck 열기 →
          </a>
        ) : null}
      </div>

      {/* Score dimensions */}
      <div className="space-y-4 mb-6">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          평가 항목 (5점 척도)
        </div>
        {SCORE_DIMENSIONS.map((dim) => (
          <ScoreRow
            key={dim.key}
            label={dim.label}
            desc={dim.desc}
            value={draft.scores[dim.key] ?? 0}
            onChange={(v) => onScoreChange(dim.key, v)}
          />
        ))}
      </div>

      {/* Comment */}
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-zinc-800 mb-1.5">
            총평 <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={draft.overall_comment}
            onChange={(e) => onFieldChange("overall_comment", e.target.value)}
            rows={3}
            placeholder="한 두 문장으로 종합 의견을 알려주세요."
            className="w-full px-4 py-3 rounded-lg text-[14px] leading-relaxed bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)] resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-medium text-zinc-800 mb-1.5">
              강점
            </label>
            <textarea
              value={draft.strengths}
              onChange={(e) => onFieldChange("strengths", e.target.value)}
              rows={2}
              placeholder="특히 강한 부분"
              className="w-full px-4 py-3 rounded-lg text-[13.5px] bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)] resize-none"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-800 mb-1.5">
              약점 · 보완할 점
            </label>
            <textarea
              value={draft.weaknesses}
              onChange={(e) => onFieldChange("weaknesses", e.target.value)}
              rows={2}
              placeholder="개선·보완이 필요한 부분"
              className="w-full px-4 py-3 rounded-lg text-[13.5px] bg-white border border-zinc-200 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(109,93,211,0.1)] resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-zinc-800 mb-2">
            후속 미팅 관심
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "yes", label: "관심 있음", color: "#10B981" },
              { key: "maybe", label: "검토 후 결정", color: "#F59E0B" },
              { key: "no", label: "당장은 없음", color: "#71717A" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onFieldChange("followup_interest", opt.key)}
                className={`h-11 rounded-lg text-[12.5px] font-medium border transition-all ${
                  draft.followup_interest === opt.key
                    ? "border-2"
                    : "border hover:bg-zinc-50 border-zinc-200 text-zinc-600"
                }`}
                style={
                  draft.followup_interest === opt.key
                    ? { borderColor: opt.color, background: opt.color + "12", color: opt.color }
                    : undefined
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Next */}
      {hasNext ? (
        <div className="mt-6 pt-5 border-t border-zinc-100">
          <button
            type="button"
            onClick={onNext}
            className="w-full h-11 rounded-lg bg-brand/10 text-brand text-[13px] font-semibold hover:bg-brand/15 transition-all"
          >
            저장하고 다음 기업 →
          </button>
        </div>
      ) : (
        <div className="mt-6 pt-5 border-t border-zinc-100 text-center text-[12.5px] text-zinc-500">
          마지막 기업입니다. 좌측 &quot;전체 평가 제출&quot; 버튼으로 마무리해주세요.
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium text-zinc-900">{label}</div>
        <div className="text-[11.5px] text-zinc-500 mt-0.5">{desc}</div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-[13px] font-semibold transition-all ${
              value >= n
                ? "bg-brand text-white shadow-sm"
                : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
