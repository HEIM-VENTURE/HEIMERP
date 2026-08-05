/**
 * 데모데이 mock 데이터.
 * 매주 데모데이 · 참여 스타트업 · 초청 심사역 · 평가 결과 관리.
 */

export type DemoDayStatus = "draft" | "scheduled" | "live" | "completed";

export type ScoreDimension =
  | "business_item"
  | "team_execution"
  | "market"
  | "tech_differentiation"
  | "finance_growth";

export const SCORE_DIMENSIONS: {
  key: ScoreDimension;
  label: string;
  desc: string;
}[] = [
  { key: "business_item", label: "사업 아이템", desc: "문제 정의 · 솔루션의 매력도" },
  { key: "team_execution", label: "팀 · 실행력", desc: "창업자·팀 역량, 실행 이력" },
  { key: "market", label: "시장성", desc: "시장 규모, 타이밍, 확장 가능성" },
  { key: "tech_differentiation", label: "기술 · 차별성", desc: "기술 경쟁력, 진입장벽" },
  { key: "finance_growth", label: "재무 · 성장성", desc: "매출·트랙션, 유닛 이코노믹스" },
];

export type Startup = {
  id: string;
  company_id: string;
  company_name: string;
  tagline: string;
  stage: string;
  pitch_time: string; // "14:00" 형식
  ir_deck_url: string | null;
};

export type Evaluator = {
  id: string;
  name: string;
  organization: string;
  role: string | null;
  invited: boolean;
  submitted: boolean;
  submitted_at: string | null;
};

export type Evaluation = {
  id: string;
  demoday_id: string;
  startup_id: string;
  evaluator_name: string;
  evaluator_organization: string;
  evaluator_role: string | null;
  scores: Record<ScoreDimension, number>;
  overall_comment: string;
  strengths: string | null;
  weaknesses: string | null;
  followup_interest: "yes" | "maybe" | "no" | null;
  submitted_at: string;
};

export type DemoDay = {
  id: string;
  code: string; // "DD-2026-W32"
  title: string;
  date: string;
  time: string; // "14:00 - 16:00"
  status: DemoDayStatus;
  zoom_url: string | null;
  startups: Startup[];
  evaluators: Evaluator[];
  evaluations: Evaluation[];
  notes: string | null;
};

export const STATUS_LABEL: Record<DemoDayStatus, string> = {
  draft: "준비 중",
  scheduled: "예정",
  live: "진행 중",
  completed: "완료",
};

export const STATUS_COLOR: Record<
  DemoDayStatus,
  { bg: string; text: string; dot: string }
> = {
  draft: { bg: "#F0F1F3", text: "#4B5563", dot: "#9CA3AF" },
  scheduled: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  live: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  completed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
};

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────
export const MOCK_DEMODAYS: DemoDay[] = [
  {
    id: "dd-2026-w33",
    code: "DD-2026-W33",
    title: "8월 3주차 데모데이",
    date: "2026-08-14",
    time: "14:00 - 16:00",
    status: "scheduled",
    zoom_url: "https://us02web.zoom.us/j/1234567890",
    startups: [
      {
        id: "startup-1",
        company_id: "co-neurofit",
        company_name: "뉴로핏",
        tagline: "AI 기반 재활 훈련 프로그램을 만드는 뇌과학 스타트업",
        stage: "초기 매출 (1~5억)",
        pitch_time: "14:00",
        ir_deck_url: "#",
      },
      {
        id: "startup-2",
        company_id: "co-quantum",
        company_name: "퀀텀브릿지",
        tagline: "양자 컴퓨팅 시뮬레이션 SDK · B2B 라이선스",
        stage: "반복 매출 (5~10억)",
        pitch_time: "14:20",
        ir_deck_url: "#",
      },
      {
        id: "startup-3",
        company_id: "co-flexlab",
        company_name: "플렉스랩",
        tagline: "중소기업용 유연근무·근태 관리 SaaS",
        stage: "PoC · 실증",
        pitch_time: "14:40",
        ir_deck_url: "#",
      },
      {
        id: "startup-4",
        company_id: "co-atomix",
        company_name: "아토믹스",
        tagline: "동네 자영업자를 위한 소셜 커머스 앱",
        stage: "MVP · 시제품",
        pitch_time: "15:00",
        ir_deck_url: "#",
      },
    ],
    evaluators: [
      {
        id: "ev-1",
        name: "오르빗파트너스 김성훈",
        organization: "오르빗파트너스 (TIPS 운영사)",
        role: "수석 심사역",
        invited: true,
        submitted: false,
        submitted_at: null,
      },
      {
        id: "ev-2",
        name: "블루포인트파트너스 이지혜",
        organization: "블루포인트파트너스 (TIPS 운영사)",
        role: "심사역",
        invited: true,
        submitted: false,
        submitted_at: null,
      },
      {
        id: "ev-3",
        name: "본엔젤스벤처파트너스 장태원",
        organization: "본엔젤스벤처파트너스",
        role: "심사역",
        invited: true,
        submitted: false,
        submitted_at: null,
      },
    ],
    evaluations: [],
    notes: "TIPS 3주차 심사 전 사전 라운드 성격. 오르빗·블루포인트 중심 태핑.",
  },
  {
    id: "dd-2026-w32",
    code: "DD-2026-W32",
    title: "8월 2주차 데모데이",
    date: "2026-08-07",
    time: "14:00 - 16:00",
    status: "completed",
    zoom_url: "https://us02web.zoom.us/j/2345678901",
    startups: [
      {
        id: "startup-w32-1",
        company_id: "co-neurofit",
        company_name: "뉴로핏",
        tagline: "AI 기반 재활 훈련 프로그램",
        stage: "초기 매출",
        pitch_time: "14:00",
        ir_deck_url: "#",
      },
      {
        id: "startup-w32-2",
        company_id: "co-quantum",
        company_name: "퀀텀브릿지",
        tagline: "양자 컴퓨팅 SDK",
        stage: "반복 매출",
        pitch_time: "14:20",
        ir_deck_url: "#",
      },
    ],
    evaluators: [
      {
        id: "ev-w32-1",
        name: "카카오벤처스 이지훈",
        organization: "카카오벤처스",
        role: "파트너",
        invited: true,
        submitted: true,
        submitted_at: "2026-08-07T15:45:00+09:00",
      },
      {
        id: "ev-w32-2",
        name: "KTB네트워크 박정민",
        organization: "KTB네트워크",
        role: "심사역",
        invited: true,
        submitted: true,
        submitted_at: "2026-08-07T15:58:00+09:00",
      },
    ],
    evaluations: [
      {
        id: "eval-w32-1",
        demoday_id: "dd-2026-w32",
        startup_id: "startup-w32-1",
        evaluator_name: "이지훈",
        evaluator_organization: "카카오벤처스",
        evaluator_role: "파트너",
        scores: {
          business_item: 4,
          team_execution: 5,
          market: 4,
          tech_differentiation: 4,
          finance_growth: 3,
        },
        overall_comment:
          "임상 근거가 탄탄하고 병원 파일럿 실적이 인상적. 다만 수익 모델의 확장성 검증 필요.",
        strengths: "임상 논문·병원 파일럿 실적, 팀 전문성",
        weaknesses: "유닛 이코노믹스, MFDS 인증 로드맵",
        followup_interest: "yes",
        submitted_at: "2026-08-07T15:45:00+09:00",
      },
      {
        id: "eval-w32-2",
        demoday_id: "dd-2026-w32",
        startup_id: "startup-w32-1",
        evaluator_name: "박정민",
        evaluator_organization: "KTB네트워크",
        evaluator_role: "심사역",
        scores: {
          business_item: 4,
          team_execution: 4,
          market: 5,
          tech_differentiation: 5,
          finance_growth: 3,
        },
        overall_comment:
          "시장 크고 기술 차별성 뚜렷. 매출 성장 속도가 아직 아쉬움.",
        strengths: "기술 차별성, 시장 성장 가능성",
        weaknesses: "매출 성장 속도, GTM 전략 구체성 부족",
        followup_interest: "yes",
        submitted_at: "2026-08-07T15:58:00+09:00",
      },
      {
        id: "eval-w32-3",
        demoday_id: "dd-2026-w32",
        startup_id: "startup-w32-2",
        evaluator_name: "이지훈",
        evaluator_organization: "카카오벤처스",
        evaluator_role: "파트너",
        scores: {
          business_item: 4,
          team_execution: 5,
          market: 4,
          tech_differentiation: 5,
          finance_growth: 4,
        },
        overall_comment: "딥테크로서 매력적. 초기 매출 트랙션이 잘 나오고 있음.",
        strengths: "딥테크 기술력, 대형 병원 파일럿",
        weaknesses: "B2C 확장은 별도 검토 필요",
        followup_interest: "yes",
        submitted_at: "2026-08-07T15:45:00+09:00",
      },
      {
        id: "eval-w32-4",
        demoday_id: "dd-2026-w32",
        startup_id: "startup-w32-2",
        evaluator_name: "박정민",
        evaluator_organization: "KTB네트워크",
        evaluator_role: "심사역",
        scores: {
          business_item: 5,
          team_execution: 4,
          market: 5,
          tech_differentiation: 5,
          finance_growth: 4,
        },
        overall_comment: "리드 검토 중. 8월 중 텀시트 예정.",
        strengths: "기술 성숙도, 매출 실적",
        weaknesses: "핵심 CTO 지분 구조 확인 필요",
        followup_interest: "yes",
        submitted_at: "2026-08-07T15:58:00+09:00",
      },
    ],
    notes: null,
  },
];

export function findDemoDayById(id: string): DemoDay | null {
  return MOCK_DEMODAYS.find((d) => d.id === id) ?? null;
}

// 평균 점수 계산 helper
export function calcAvgScore(evaluations: Evaluation[]): number {
  if (evaluations.length === 0) return 0;
  const sum = evaluations.reduce((s, e) => {
    const dimSum = SCORE_DIMENSIONS.reduce((ds, d) => ds + (e.scores[d.key] ?? 0), 0);
    return s + dimSum / SCORE_DIMENSIONS.length;
  }, 0);
  return Math.round((sum / evaluations.length) * 10) / 10;
}

export function calcStartupScores(demoday: DemoDay, startupId: string) {
  const evals = demoday.evaluations.filter((e) => e.startup_id === startupId);
  const byDimension: Record<ScoreDimension, number> = {} as any;
  for (const dim of SCORE_DIMENSIONS) {
    const scores = evals.map((e) => e.scores[dim.key] ?? 0).filter((s) => s > 0);
    byDimension[dim.key] =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
  }
  const overall =
    evals.length > 0 ? calcAvgScore(evals) : 0;
  return { overall, byDimension, count: evals.length };
}
