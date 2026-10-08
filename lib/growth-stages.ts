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

/**
 * 기업 데이터로 J-커브 단계 자동 추론.
 * 간단한 heuristic — 매출(백만원)·직원수·설립일·투자유치 기반.
 * 사용자가 수동 조정 가능하되 초안 제공용.
 */
export type InferInput = {
  last_year_revenue: number | null;   // 백만원
  headcount: number | null;
  founded_at: string | null;          // YYYY-MM-DD
  committed_count: number;            // 투자 확약(committed) 이벤트 수
  interested_count: number;           // 관심/검토 이벤트 수
  passed_count: number;               // 거절 이벤트 수
  consulting_stage: string | null;
};

export type InferResult = {
  step: number;
  rationale: string;
};

export function inferGrowthStage(input: InferInput): InferResult {
  const revEok = input.last_year_revenue != null ? input.last_year_revenue / 100 : null;
  const hc = input.headcount ?? null;

  // 설립 후 개월
  let ageMonths: number | null = null;
  if (input.founded_at) {
    const founded = new Date(input.founded_at);
    const now = new Date();
    ageMonths = (now.getFullYear() - founded.getFullYear()) * 12 + (now.getMonth() - founded.getMonth());
  }

  const reasons: string[] = [];

  // 10단계: 매우 성숙 (매출 100억+, 재투자 라운드)
  if (revEok != null && revEok >= 100 && input.committed_count >= 2) {
    reasons.push(`매출 ${revEok.toFixed(0)}억 + 확약 ${input.committed_count}건`);
    return { step: 10, rationale: `지속가능 (${reasons.join(" · ")})` };
  }

  // 9단계: 재성장 — 50억+ 매출 + 확약 1건+
  if (revEok != null && revEok >= 50 && input.committed_count >= 1) {
    reasons.push(`매출 ${revEok.toFixed(0)}억 + 확약 ${input.committed_count}건`);
    return { step: 9, rationale: `재성장·재설계 (${reasons.join(" · ")})` };
  }

  // 8단계: 시스템기업 — 매출 30억+ + 직원 15+
  if (revEok != null && revEok >= 30 && hc != null && hc >= 15) {
    reasons.push(`매출 ${revEok.toFixed(0)}억 · 직원 ${hc}명`);
    return { step: 8, rationale: `시스템기업 (${reasons.join(" · ")})` };
  }

  // 7단계: 규모확장 — 매출 15억+ + 직원 10+
  if (revEok != null && revEok >= 15 && hc != null && hc >= 10) {
    reasons.push(`매출 ${revEok.toFixed(0)}억 · 직원 ${hc}명`);
    return { step: 7, rationale: `규모확장 (${reasons.join(" · ")})` };
  }

  // 6단계: 확장준비 — 매출 5억+ 또는 직원 5-10 + 투자 유치
  if (revEok != null && revEok >= 5) {
    reasons.push(`매출 ${revEok.toFixed(1)}억`);
    if (input.committed_count > 0) reasons.push(`확약 ${input.committed_count}건`);
    return { step: 6, rationale: `확장준비 (${reasons.join(" · ")})` };
  }

  // 5단계: 반복엔진 — 매출 1-5억 (수익 반복)
  if (revEok != null && revEok >= 1) {
    reasons.push(`매출 ${revEok.toFixed(1)}억`);
    return { step: 5, rationale: `반복엔진 (${reasons.join(" · ")})` };
  }

  // 4단계: PMF — 매출 0.1-1억 (초기 유료 고객 확보)
  if (revEok != null && revEok > 0 && revEok < 1) {
    reasons.push(`초기 매출 ${revEok.toFixed(2)}억`);
    return { step: 4, rationale: `시장적합 PMF (${reasons.join(" · ")})` };
  }

  // 3단계: 해결·가설검증 — 매출 0 + 직원 2+ + 설립 6개월+
  if (hc != null && hc >= 2 && ageMonths != null && ageMonths >= 6) {
    reasons.push(`직원 ${hc}명 · 설립 ${ageMonths}개월`);
    return { step: 3, rationale: `해결·가설검증 (${reasons.join(" · ")})` };
  }

  // 2단계: 문제확증 — 설립 3개월+, 직원 1+
  if (ageMonths != null && ageMonths >= 3) {
    reasons.push(`설립 ${ageMonths}개월`);
    if (hc != null) reasons.push(`직원 ${hc}명`);
    return { step: 2, rationale: `문제확증 (${reasons.join(" · ")})` };
  }

  // 1단계: 기회가설 — 설립 매우 초기, 데이터 부족
  reasons.push(ageMonths != null ? `설립 ${ageMonths}개월` : "데이터 부족");
  return { step: 1, rationale: `기회가설 (${reasons.join(" · ")})` };
}
