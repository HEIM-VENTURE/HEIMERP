"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  GROWTH_STAGES,
  ZONE_META,
  stageMeta,
  inferGrowthStage,
  type InferInput,
} from "@/lib/growth-stages";
import { updateCompanyField } from "./actions";
import { TrendingUp, Pencil, Check, X, Sparkles } from "lucide-react";

type Props = {
  companyId: number;
  currentStep: number | null;
  note: string | null;
  // 자동 추정 input
  inferInput: InferInput;
};

export function JCurveCard({
  companyId,
  currentStep: initialStep,
  note: initialNote,
  inferInput,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<number | null>(initialStep);
  const [note, setNote] = useState<string>(initialNote ?? "");
  const [editing, setEditing] = useState(false);
  const [draftStep, setDraftStep] = useState<number | null>(initialStep);
  const [draftNote, setDraftNote] = useState<string>(initialNote ?? "");
  const [pending, start] = useTransition();
  const [inferResult, setInferResult] = useState<ReturnType<typeof inferGrowthStage> | null>(null);

  const current = stageMeta(step);
  const draftCurrent = stageMeta(draftStep);
  const zoneMeta = current ? ZONE_META[current.zone] : null;

  const openEdit = () => {
    setDraftStep(step);
    setDraftNote(note);
    setInferResult(null);
    setEditing(true);
  };

  const runInfer = () => {
    const r = inferGrowthStage(inferInput);
    setInferResult(r);
    setDraftStep(r.step);
    if (!draftNote) setDraftNote(`[자동 추정] ${r.rationale}`);
  };

  const save = () => {
    start(async () => {
      const res = await updateCompanyField(companyId, {
        growth_stage: draftStep ?? null,
        growth_stage_note: draftNote || null,
      } as never);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      setStep(draftStep);
      setNote(draftNote);
      setEditing(false);
      setInferResult(null);
      router.refresh();
    });
  };

  return (
    <div className="bg-gradient-to-br from-white to-brand/5 border border-brand/20 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-[15px] font-bold text-zinc-900 inline-flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand" />
            성장 단계 (J-커브)
          </h3>
          <p className="text-[11.5px] text-zinc-500 mt-0.5">
            HEIM 10단계 성장 모델 · 자본·전략 선택의 기준
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-zinc-300 text-[12px] text-zinc-700 hover:border-brand hover:text-brand transition-colors"
          >
            <Pencil className="w-3 h-3" /> 단계 설정
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={runInfer}
              disabled={pending}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-brand text-white text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              자동 추정
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setInferResult(null);
              }}
              disabled={pending}
              className="p-1.5 rounded text-zinc-500 hover:text-zinc-900"
              title="취소"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              title="저장"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 큰 J-커브 SVG */}
      <div className="rounded-xl bg-white border border-zinc-100 p-5 mb-4">
        <JCurveSvgLarge currentStep={editing ? draftStep : step} />
      </div>

      {/* 자동 추정 결과 (하이라이트) */}
      {editing && inferResult ? (
        <div className="mb-3 p-3 rounded-lg bg-brand/10 border border-brand/30">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="text-[12px] font-semibold text-brand">
              자동 추정: {inferResult.step}단계 · {GROWTH_STAGES[inferResult.step - 1].label}
            </span>
          </div>
          <div className="text-[11.5px] text-zinc-700">{inferResult.rationale}</div>
          <div className="text-[10.5px] text-zinc-500 mt-1">
            드롭다운에서 수정 후 저장할 수 있어요.
          </div>
        </div>
      ) : null}

      {/* 현재 단계 요약 */}
      {editing ? (
        <div className="space-y-2">
          <select
            value={draftStep ?? ""}
            onChange={(e) => setDraftStep(e.target.value ? Number(e.target.value) : null)}
            disabled={pending}
            className="w-full h-10 px-3 rounded-md border border-zinc-300 text-[13px] bg-white cursor-pointer"
          >
            <option value="">— 단계 선택 —</option>
            {GROWTH_STAGES.map((s) => (
              <option key={s.step} value={s.step}>
                {s.step}. {s.label} · {s.subtitle}
              </option>
            ))}
          </select>
          <textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            rows={2}
            placeholder="이 단계에서의 핵심 병목·과업 메모 (선택)"
            disabled={pending}
            className="w-full px-3 py-2 rounded-md border border-zinc-300 text-[12.5px] focus:outline-none focus:border-brand resize-none"
          />
          {draftCurrent ? (
            <div
              className="text-[11.5px] px-3 py-2 rounded-md"
              style={{
                background: ZONE_META[draftCurrent.zone].bg,
                color: ZONE_META[draftCurrent.zone].color,
              }}
            >
              <b>{ZONE_META[draftCurrent.zone].label}</b> · {ZONE_META[draftCurrent.zone].sub}
            </div>
          ) : null}
        </div>
      ) : current ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 현재 단계 */}
          <div className="sm:col-span-2 bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <span className="text-[32px] font-bold text-brand tabular-nums leading-none">
                {current.step}
              </span>
              <span className="text-[16px] font-bold text-zinc-900">{current.label}</span>
            </div>
            <div className="text-[12.5px] text-zinc-500 mb-2">{current.subtitle}</div>
            {zoneMeta ? (
              <div
                className="inline-block text-[11px] px-2 py-0.5 rounded font-semibold"
                style={{ background: zoneMeta.bg, color: zoneMeta.color }}
              >
                {zoneMeta.label}
              </div>
            ) : null}
            {note ? (
              <div className="mt-2 text-[12px] text-zinc-700 whitespace-pre-wrap">
                {note}
              </div>
            ) : null}
          </div>

          {/* 다음 단계 미리보기 */}
          {current.step < 10 ? (
            <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-4">
              <div className="text-[10.5px] font-semibold text-zinc-500 uppercase mb-1.5">
                다음 단계
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[18px] font-bold text-zinc-400 tabular-nums">
                  {current.step + 1}
                </span>
                <span className="text-[13px] font-semibold text-zinc-700">
                  {GROWTH_STAGES[current.step].label}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500">
                {GROWTH_STAGES[current.step].subtitle}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="text-[10.5px] font-semibold text-emerald-700 uppercase mb-1.5">
                🎉 최종 단계
              </div>
              <div className="text-[13px] font-semibold text-emerald-900">
                지속가능기업 도달
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
          <div className="text-[13px] text-zinc-500 mb-2">
            아직 성장 단계가 설정되지 않았습니다
          </div>
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-brand text-white text-[12.5px] font-medium hover:opacity-90"
          >
            <Sparkles className="w-3.5 h-3.5" />
            자동 추정으로 시작
          </button>
        </div>
      )}
    </div>
  );
}

/** 큰 J-커브 SVG - 전체 10단계 라벨까지 표시 */
export function JCurveSvgLarge({ currentStep }: { currentStep: number | null }) {
  const w = 1200;
  const h = 320;
  const padX = 40;
  const padY = 30;

  const toX = (vx: number) => padX + (vx / 100) * (w - padX * 2);
  const toY = (vy: number) => padY + (vy / 80) * (h - padY * 2);

  const points = GROWTH_STAGES.map((s) => ({ x: toX(s.x), y: toY(s.y), s }));

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) * 0.5;
    const cp2y = curr.y;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }

  const zeroY = toY(42);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {/* 축 라벨 */}
      <text x={padX - 25} y={padY + 10} fontSize="11" fill="#71717A">+</text>
      <text x={padX - 25} y={zeroY + 4} fontSize="11" fill="#71717A">0</text>
      <text x={padX - 25} y={h - padY + 4} fontSize="11" fill="#71717A">-</text>
      <text x={padX - 32} y={padY - 10} fontSize="10" fill="#A1A1AA" fontStyle="italic">
        기업가치
      </text>
      <text x={w - padX + 2} y={h - padY + 16} fontSize="10" fill="#A1A1AA" fontStyle="italic">
        시간→
      </text>

      {/* 0선 */}
      <line
        x1={padX}
        x2={w - padX}
        y1={zeroY}
        y2={zeroY}
        stroke="#E4E4E7"
        strokeWidth={1}
        strokeDasharray="4,4"
      />

      {/* 커브 */}
      <path d={path} fill="none" stroke="#1F2A36" strokeWidth={2.5} strokeLinecap="round" />

      {/* 10개 포인트 + 라벨 */}
      {points.map(({ x, y, s }) => {
        const isCurrent = currentStep === s.step;
        const isPast = currentStep !== null && currentStep !== undefined && s.step < currentStep;
        const r = isCurrent ? 11 : 6;
        const fill = isCurrent ? "#DC2626" : isPast ? "#64748B" : "#FFFFFF";
        const stroke = isCurrent ? "#DC2626" : isPast ? "#64748B" : "#CBD5E1";
        const strokeW = isCurrent ? 3 : 1.6;
        const labelY = s.y > 40 ? y + 22 : y - 14;
        const subY = s.y > 40 ? y + 34 : y - 24;

        return (
          <g key={s.step}>
            {/* 현재 단계 pulse ring */}
            {isCurrent ? (
              <circle
                cx={x}
                cy={y}
                r={r + 4}
                fill="none"
                stroke="#DC2626"
                strokeWidth={1}
                opacity={0.3}
              />
            ) : null}
            <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            {/* step number inside */}
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontSize={isCurrent ? "11" : "9"}
              fill={isCurrent ? "#FFFFFF" : isPast ? "#FFFFFF" : "#71717A"}
              fontWeight="bold"
            >
              {s.step}
            </text>
            {/* label */}
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              fontSize={isCurrent ? "12" : "10.5"}
              fill={isCurrent ? "#DC2626" : "#52525B"}
              fontWeight={isCurrent ? 700 : 500}
            >
              {s.label}
            </text>
            {/* subtitle - current 만 */}
            {isCurrent ? (
              <text
                x={x}
                y={subY}
                textAnchor="middle"
                fontSize="9.5"
                fill="#71717A"
              >
                {s.subtitle}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/** 작은 버전 (파이프라인 등 밀도 높은 곳용) */
export function JCurveSvgCompact({ currentStep }: { currentStep: number | null }) {
  const w = 160;
  const h = 40;
  const padX = 2;
  const padY = 4;
  const toX = (vx: number) => padX + (vx / 100) * (w - padX * 2);
  const toY = (vy: number) => padY + (vy / 80) * (h - padY * 2);

  const points = GROWTH_STAGES.map((s) => ({ x: toX(s.x), y: toY(s.y), s }));
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    path += ` C ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${prev.x + (curr.x - prev.x) * 0.5} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={path} fill="none" stroke="#9CA3AF" strokeWidth={1.2} strokeLinecap="round" />
      {points.map(({ x, y, s }) => {
        const isCurrent = currentStep === s.step;
        return (
          <circle
            key={s.step}
            cx={x}
            cy={y}
            r={isCurrent ? 2.8 : 1.4}
            fill={isCurrent ? "#DC2626" : "#CBD5E1"}
          />
        );
      })}
    </svg>
  );
}
