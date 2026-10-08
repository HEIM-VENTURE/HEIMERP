// HEIM J-커브 10단계 정의
export type Zone = "investment" | "acceleration" | "maximization";

export type GrowthStage = {
  step: number;      // 1~10
  label: string;
  subtitle: string;
  zone: Zone;
  // SVG viewBox 0..100 × 0..80 좌표
  x: number;
  y: number;
};

export const GROWTH_STAGES: readonly GrowthStage[] = [
  { step: 1,  label: "기회가설",       subtitle: "문제 정의",         zone: "investment",     x: 2,   y: 42 },
  { step: 2,  label: "문제확증",       subtitle: "고객 공감",         zone: "investment",     x: 12,  y: 56 },
  { step: 3,  label: "해결·가설검증",  subtitle: "MVP·초기거래",      zone: "investment",     x: 22,  y: 60 },
  { step: 4,  label: "시장적합(PMF)",  subtitle: "PMF 달성",          zone: "acceleration",   x: 32,  y: 48 },
  { step: 5,  label: "반복엔진",       subtitle: "수익 반복",         zone: "acceleration",   x: 42,  y: 38 },
  { step: 6,  label: "확장준비",       subtitle: "역량·자원 정비",    zone: "acceleration",   x: 52,  y: 28 },
  { step: 7,  label: "규모확장",       subtitle: "시장 확대",         zone: "maximization",   x: 62,  y: 20 },
  { step: 8,  label: "시스템기업",     subtitle: "운영 최적화",       zone: "maximization",   x: 72,  y: 13 },
  { step: 9,  label: "재성장·재설계",  subtitle: "사업모델 진화",     zone: "maximization",   x: 85,  y: 8  },
  { step: 10, label: "지속가능기업",   subtitle: "영속·승계",         zone: "maximization",   x: 97,  y: 4  },
] as const;

export const ZONE_META: Record<Zone, { label: string; sub: string; color: string; bg: string }> = {
  investment: {
    label: "투자·학습 구간",
    sub: "탐색과 검증으로 가설 입증",
    color: "#B91C1C",
    bg: "#FEE2E2",
  },
  acceleration: {
    label: "성장 가속 구간",
    sub: "반복 모델로 수익 본격화",
    color: "#1D4ED8",
    bg: "#DBEAFE",
  },
  maximization: {
    label: "가치 극대화 구간",
    sub: "사업 확장·가치 최대화",
    color: "#065F46",
    bg: "#D1FAE5",
  },
};

export function stageMeta(step: number | null | undefined): GrowthStage | null {
  if (!step) return null;
  return GROWTH_STAGES.find((s) => s.step === step) ?? null;
}
