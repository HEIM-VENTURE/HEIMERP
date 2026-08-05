"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { VERDICT_LABEL, type Verdict } from "@/lib/demoday/types";

type ScoreKey = "team" | "market" | "tech" | "bm";

type Startup = {
  id: string;
  companyName: string;
  companyTagline: string | null;
  companyStage: string | null;
  session: string | null;
  pitchTime: string | null;
  irDeckUrl: string | null;
  ceoName: string | null;
};

type Existing = {
  scores: Record<ScoreKey, number>;
  strengths: string;
  concerns: string;
  requests: string;
  verdict: Verdict;
};

type Draft = {
  scores: Partial<Record<ScoreKey, number>>;
  strengths: string;
  concerns: string;
  requests: string;
  verdict: Verdict | null;
};

const SCORE_DIMENSIONS: { key: ScoreKey; label: string; desc: string }[] = [
  { key: "team", label: "팀", desc: "창업자·팀 역량, 실행력" },
  { key: "market", label: "시장", desc: "시장 규모, 타이밍, 확장성" },
  { key: "tech", label: "기술", desc: "기술 경쟁력, 차별성, 진입장벽" },
  { key: "bm", label: "BM", desc: "비즈니스 모델, 매출·트랙션" },
];

const VERDICT_ORDER: Verdict[] = [
  "interested",
  "additional_review",
  "hold",
  "reject",
  "undecided",
];

const VERDICT_COLOR: Record<Verdict, string> = {
  interested: "#10B981",
  additional_review: "#3B82F6",
  hold: "#F59E0B",
  reject: "#EF4444",
  undecided: "#71717A",
};

export function EvaluationForm({
  token,
  startup,
  existing,
}: {
  token: string;
  startup: Startup;
  existing: Existing | null;
}) {
  const router = useRouter();
  const storageKey = `demoday-${token}-${startup.id}`;

  const [draft, setDraft] = useState<Draft>(() => {
    if (existing) {
      return {
        scores: existing.scores,
        strengths: existing.strengths,
        concerns: existing.concerns,
        requests: existing.requests,
        verdict: existing.verdict,
      };
    }
    return {
      scores: {},
      strengths: "",
      concerns: "",
      requests: "",
      verdict: null,
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // localStorage restore on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Draft;
        setDraft(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey]);

  // Auto-save on every draft change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, storageKey, hydrated]);

  const setScore = (key: ScoreKey, val: number) => {
    setDraft((d) => ({ ...d, scores: { ...d.scores, [key]: val } }));
  };

  const canSubmit =
    SCORE_DIMENSIONS.every((d) => (draft.scores[d.key] ?? 0) >= 1) &&
    draft.verdict !== null &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/demoday/submission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          startupId: startup.id,
          scores: draft.scores,
          strengths: draft.strengths || null,
          concerns: draft.concerns || null,
          requests: draft.requests || null,
          verdict: draft.verdict,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "제출 실패");
      }
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      router.push(`/demoday/j/${token}?submitted=${encodeURIComponent(startup.id)}`);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "제출 실패";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticky header — startup identity */}
      <div className="sticky top-[52px] -mx-4 px-4 py-3 bg-[#FBFAF5]/95 backdrop-blur border-b border-zinc-200 z-[1]">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {startup.session ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
              {startup.session}
            </span>
          ) : null}
          {startup.pitchTime ? (
            <span className="text-[10.5px] font-mono text-zinc-500 inline-flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {startup.pitchTime}
            </span>
          ) : null}
          {existing ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium inline-flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              제출됨 · 수정 가능
            </span>
          ) : null}
        </div>
        <h2 className="text-[17px] font-bold text-zinc-900 leading-tight">
          {startup.companyName}
        </h2>
        <div className="text-[11.5px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
          {startup.ceoName ? <span>대표 {startup.ceoName}</span> : null}
          {startup.ceoName && startup.companyStage ? (
            <span className="text-zinc-300">·</span>
          ) : null}
          {startup.companyStage ? <span>{startup.companyStage}</span> : null}
        </div>
        {startup.companyTagline ? (
          <p className="text-[12px] text-zinc-600 mt-1 leading-snug line-clamp-2">
            {startup.companyTagline}
          </p>
        ) : null}
        {startup.irDeckUrl ? (
          <a
            href={startup.irDeckUrl}
            target="_blank"
            rel="noopener"
            className="inline-block text-[11.5px] mt-1.5"
            style={{ color: "#C74815" }}
          >
            IR Deck 열기 →
          </a>
        ) : null}
      </div>

      {/* Scores */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-3">
          평가 항목 (1 낮음 · 5 매우 우수)
        </div>
        <div className="space-y-5">
          {SCORE_DIMENSIONS.map((dim) => (
            <div key={dim.key}>
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <div className="text-[13.5px] font-semibold text-zinc-900">
                    {dim.label}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{dim.desc}</div>
                </div>
                <div className="text-[15px] font-bold tabular-nums text-zinc-900">
                  {draft.scores[dim.key] ?? "—"}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = draft.scores[dim.key] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScore(dim.key, n)}
                      className={`h-12 rounded-xl text-[15px] font-bold transition-all ${
                        active
                          ? "bg-[#C74815] text-white shadow"
                          : "bg-zinc-50 text-zinc-500 border border-zinc-200 active:bg-zinc-100"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-3">
          투자 판단 <span className="text-rose-500 normal-case">*</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {VERDICT_ORDER.map((v) => {
            const active = draft.verdict === v;
            const color = VERDICT_COLOR[v];
            return (
              <button
                key={v}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, verdict: v }))}
                className={`h-12 rounded-xl text-[13.5px] font-semibold transition-all border ${
                  active ? "" : "bg-white border-zinc-200 text-zinc-700 active:bg-zinc-50"
                }`}
                style={
                  active
                    ? {
                        borderColor: color,
                        background: color + "12",
                        color,
                      }
                    : undefined
                }
              >
                {VERDICT_LABEL[v]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Free text */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4">
        <TextField
          label="강점"
          placeholder="특히 강한 부분 (선택)"
          value={draft.strengths}
          onChange={(v) => setDraft((d) => ({ ...d, strengths: v }))}
        />
        <TextField
          label="우려 · 리스크"
          placeholder="개선·검증이 필요한 부분 (선택)"
          value={draft.concerns}
          onChange={(v) => setDraft((d) => ({ ...d, concerns: v }))}
        />
        <TextField
          label="추가 요청 사항"
          placeholder="대표에게 전달할 요청 or 자료 (선택)"
          value={draft.requests}
          onChange={(v) => setDraft((d) => ({ ...d, requests: v }))}
        />
      </div>

      {/* Error */}
      {error ? (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[12.5px] text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">제출 실패</div>
            <div>{error}</div>
            <div className="mt-1 text-[11px] text-rose-600">
              작성 내용은 로컬에 저장되어 있습니다. 다시 시도해 주세요.
            </div>
          </div>
        </div>
      ) : null}

      {/* Submit */}
      <div className="pt-1 pb-2">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="w-full h-14 rounded-2xl bg-emerald-600 text-white text-[15px] font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              제출 중...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {existing ? "평가 수정 제출" : "평가 제출"}
            </>
          )}
        </button>
        {!canSubmit && !submitting ? (
          <div className="text-[11px] text-zinc-500 text-center mt-2">
            4개 점수와 투자 판단을 모두 선택해 주세요.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-zinc-800 mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full px-3 py-2.5 rounded-lg text-[13.5px] bg-white border border-zinc-200 focus:outline-none focus:border-[#C74815] focus:ring-2 focus:ring-[#C74815]/15 resize-none"
      />
    </div>
  );
}
