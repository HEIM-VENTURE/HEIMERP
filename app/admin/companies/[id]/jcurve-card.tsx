"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GROWTH_STAGES, ZONE_META, stageMeta } from "@/lib/growth-stages";
import { updateCompanyField } from "./actions";
import { TrendingUp, Pencil, Check, X } from "lucide-react";

type Props = {
  companyId: number;
  currentStep: number | null;
  note: string | null;
};

export function JCurveCard({ companyId, currentStep: initialStep, note: initialNote }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<number | null>(initialStep);
  const [note, setNote] = useState<string>(initialNote ?? "");
  const [editing, setEditing] = useState(false);
  const [draftStep, setDraftStep] = useState<number | null>(initialStep);
  const [draftNote, setDraftNote] = useState<string>(initialNote ?? "");
  const [pending, start] = useTransition();

  const current = stageMeta(step);
  const draftCurrent = stageMeta(draftStep);
  const zoneMeta = current ? ZONE_META[current.zone] : null;

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
      router.refresh();
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-brand" />
          성장 단계 (J-커브)
        </h3>
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setDraftStep(step);
              setDraftNote(note);
              setEditing(true);
            }}
            className="text-[11px] text-zinc-500 hover:text-brand inline-flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" /> 변경
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={pending}
              className="p-1 rounded text-zinc-400 hover:text-zinc-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* J-커브 SVG */}
      <JCurveSvg currentStep={editing ? draftStep : step} />

      {/* 현재 단계 요약 */}
      {editing ? (
        <div className="mt-3 space-y-2">
          <select
            value={draftStep ?? ""}
            onChange={(e) => setDraftStep(e.target.value ? Number(e.target.value) : null)}
            disabled={pending}
            className="w-full h-9 px-3 rounded-md border border-zinc-300 text-[13px] bg-white cursor-pointer"
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
            placeholder="이 단계에서의 핵심 병목·과업 메모"
            disabled={pending}
            className="w-full px-3 py-2 rounded-md border border-zinc-300 text-[12.5px] focus:outline-none focus:border-brand resize-none"
          />
          {draftCurrent ? (
            <div
              className="text-[11px] px-2.5 py-1.5 rounded"
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
        <div className="mt-3">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[22px] font-bold text-zinc-900 tabular-nums">{current.step}</span>
            <span className="text-[14px] font-semibold text-zinc-900">{current.label}</span>
            <span className="text-[11.5px] text-zinc-500">· {current.subtitle}</span>
          </div>
          {zoneMeta ? (
            <div
              className="inline-block text-[10.5px] px-2 py-0.5 rounded font-semibold"
              style={{ background: zoneMeta.bg, color: zoneMeta.color }}
            >
              {zoneMeta.label}
            </div>
          ) : null}
          {note ? (
            <div className="mt-2 text-[12px] text-zinc-700 whitespace-pre-wrap p-2 rounded bg-zinc-50/60">
              {note}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 text-[12px] text-zinc-400 py-2 text-center">
          단계 미지정 · "변경"으로 설정
        </div>
      )}
    </div>
  );
}

/** 10단계 점을 J모양으로 그리는 SVG */
export function JCurveSvg({
  currentStep,
  compact = false,
}: {
  currentStep: number | null;
  compact?: boolean;
}) {
  const w = 300;
  const h = compact ? 70 : 110;
  const padX = compact ? 4 : 8;
  const padY = compact ? 4 : 8;

  // 좌표 변환 (viewBox 100×80 → w×h)
  const toX = (vx: number) => padX + (vx / 100) * (w - padX * 2);
  const toY = (vy: number) => padY + (vy / 80) * (h - padY * 2);

  // 곡선 path (스무스하게)
  const points = GROWTH_STAGES.map((s) => ({ x: toX(s.x), y: toY(s.y) }));
  // Catmull-Rom 스타일 간단 approx (M + S cubic)
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

  const zeroY = toY(42); // step1 수준

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxHeight: h }}>
      {/* 0선 (가치=0 기준) */}
      <line
        x1={0}
        x2={w}
        y1={zeroY}
        y2={zeroY}
        stroke="#E4E4E7"
        strokeWidth={0.8}
        strokeDasharray="2,2"
      />

      {/* 커브 */}
      <path d={path} fill="none" stroke="#1F2A36" strokeWidth={1.6} strokeLinecap="round" />

      {/* 10개 포인트 */}
      {GROWTH_STAGES.map((s) => {
        const x = toX(s.x);
        const y = toY(s.y);
        const isCurrent = currentStep === s.step;
        const isPast = currentStep !== null && currentStep !== undefined && s.step < currentStep;
        const r = isCurrent ? 5 : compact ? 2.5 : 3;
        const fill = isCurrent
          ? "#DC2626"
          : isPast
          ? "#64748B"
          : "#FFFFFF";
        const stroke = isCurrent ? "#DC2626" : isPast ? "#64748B" : "#CBD5E1";
        return (
          <g key={s.step}>
            <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={1.2} />
            {!compact ? (
              <text
                x={x}
                y={y - 7}
                textAnchor="middle"
                fontSize="7"
                fill={isCurrent ? "#DC2626" : "#64748B"}
                fontWeight={isCurrent ? 700 : 500}
              >
                {s.step}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
