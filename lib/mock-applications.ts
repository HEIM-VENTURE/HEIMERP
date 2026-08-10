/**
 * Phase 1 UI 껍데기용 mock 데이터.
 * Phase 1b/1c 완성 후 Google Sheet 실데이터로 교체 예정.
 */

export type ApplicationStatus =
  | "new"          // 신규 접수 (미검토)
  | "reviewing"    // 검토 중
  | "go"           // GO 결정
  | "conditional"  // 조건부 GO
  | "more_docs"    // 자료 요청
  | "no_go";       // NO-GO

export type Application = {
  id: string;
  application_no: string;
  received_at: string;
  status: ApplicationStatus;
  company_name: string;
  business_number: string | null;
  ceo_name: string;
  headcount: number;
  website: string | null;
  tagline: string;
  contact_name: string;
  contact_role: string | null;
  email: string;
  phone: string;
  growth_stage: string;
  revenue_range: string;
  growth_trend: string;
  priorities: string[];
  goals: string;
  channel: string | null;
  files: {
    ir_deck: { name: string; url: string; size_mb: number } | null;
    business_cert: { name: string; url: string; size_mb: number } | null;
    company_intro: { name: string; url: string; size_mb: number } | null;
  };
  reviewer: string | null;
  review_deadline: string | null;
  ai_summary: {
    business_model: string;
    market: string;
    strengths: string[];
    weaknesses: string[];
    risks: string[];
    recommendation: string;
    fit_score: number;
  } | null;
  review_notes: string | null;
  decided_at: string | null;
};

export const GROWTH_STAGE_LABEL: Record<string, string> = {
  idea: "아이디어 · 고객 문제 구체화",
  mvp: "MVP · 시제품 개발",
  poc: "PoC · 실증",
  early_revenue: "초기 유료 매출 발생",
  recurring: "반복 매출 구축",
  scaling: "매출·조직 확장",
  pre_ipo: "IPO · 해외진출 준비",
};

export const REVENUE_LABEL: Record<string, string> = {
  none: "매출 없음",
  under_1: "1억원 미만",
  "1_to_5": "1억 ~ 5억원",
  "5_to_10": "5억 ~ 10억원",
  "10_to_30": "10억 ~ 30억원",
  "30_to_100": "30억 ~ 100억원",
  over_100: "100억원 이상",
  unknown: "확인 필요",
};

export const TREND_LABEL: Record<string, string> = {
  declining: "감소",
  flat: "정체",
  slow_growth: "완만한 성장",
  fast_growth: "빠른 성장",
  too_early: "실적 비교 어려움",
  not_tracked: "지표 관리 이전",
};

export const PRIORITY_LABEL: Record<string, string> = {
  market_customer: "시장·핵심 고객 설정",
  product_tech: "제품·기술 고도화",
  revenue_model: "수익 모델·수익성",
  marketing_sales: "마케팅·영업 확대",
  retention: "고객 유지·반복 매출",
  finance_ops: "재무·운영 자금",
  hr_org: "핵심 인력·조직 운영",
  strategy: "사업 전략·우선순위",
  fundraising: "투자 유치·자금조달",
  regulation: "규제·인허가",
  other: "기타",
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "신규 접수",
  reviewing: "검토 중",
  go: "GO",
  conditional: "조건부 GO",
  more_docs: "자료 요청",
  no_go: "NO-GO",
};

export const STATUS_COLOR: Record<
  ApplicationStatus,
  { bg: string; text: string; dot: string }
> = {
  new: { bg: "#F0F1F3", text: "#4B5563", dot: "#9CA3AF" },
  reviewing: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  go: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  conditional: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  more_docs: { bg: "#FBEAE5", text: "#A83A20", dot: "#E5531F" },
  no_go: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
};

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────
export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app-2026-0042",
    application_no: "HEIM-APP-2026-0042",
    received_at: "2026-08-01T09:14:00+09:00",
    status: "reviewing",
    company_name: "뉴로핏",
    business_number: "123-45-67890",
    ceo_name: "김도현",
    headcount: 12,
    website: "https://neurofit.example.com",
    tagline: "AI 기반 재활 훈련 프로그램을 만드는 뇌과학 스타트업",
    contact_name: "박은지",
    contact_role: "COO",
    email: "eunji@neurofit.example.com",
    phone: "010-1234-5678",
    growth_stage: "early_revenue",
    revenue_range: "1_to_5",
    growth_trend: "fast_growth",
    priorities: ["fundraising", "product_tech", "marketing_sales"],
    goals:
      "12개월 목표: 2027년 6월까지 연매출 15억원, 계약 병원 40곳 확보.\n확인하고 싶은 내용: TIPS 선정 가능성, 시리즈 A 유치 전 준비할 것.",
    channel: "referral",
    files: {
      ir_deck: { name: "뉴로핏_IR_v3.pdf", url: "#", size_mb: 8.4 },
      business_cert: { name: "사업자등록증_뉴로핏.pdf", url: "#", size_mb: 0.3 },
      company_intro: null,
    },
    reviewer: "허유나",
    review_deadline: "2026-08-08",
    ai_summary: {
      business_model:
        "뇌졸중·인지장애 환자를 위한 게임형 재활 소프트웨어 SaaS. 병원 B2B로 월 구독료 수취.",
      market:
        "국내 신경계 재활 시장 약 3,200억 (2025). 고령화로 CAGR 12% 성장 중. 경쟁사는 유사한 하드웨어 중심 업체 2-3곳 존재.",
      strengths: [
        "서울대병원·아산 등 대형 병원 파일럿 이력 3건",
        "임상 논문 2편 게재 (신뢰도)",
        "월 활성 환자 800명 → 6개월간 3배 성장",
      ],
      weaknesses: [
        "매출 대비 인건비 비중 70% (재무 여력 부족)",
        "해외 진출 가설 미검증",
        "IR Deck에 유닛 이코노믹스 · CAC/LTV 지표 없음",
      ],
      risks: [
        "의료기기 인증 (MFDS) 미확보 — 정식 처방 확대 시 필수",
        "핵심 CTO 지분율 불명확 (주주명부 미제출)",
      ],
      recommendation:
        "GO 추천. TIPS 적합성 높음 (뇌과학 딥테크). 다만 IR Deck 유닛 이코노믹스 · MFDS 로드맵 보완 필요.",
      fit_score: 82,
    },
    review_notes: null,
    decided_at: null,
  },
  {
    id: "app-2026-0041",
    application_no: "HEIM-APP-2026-0041",
    received_at: "2026-07-31T16:22:00+09:00",
    status: "new",
    company_name: "플렉스랩",
    business_number: "234-56-78901",
    ceo_name: "이서준",
    headcount: 6,
    website: "https://flexlab.example.com",
    tagline: "중소기업용 유연근무·근태 관리 SaaS",
    contact_name: "이서준",
    contact_role: "CEO",
    email: "seojun@flexlab.example.com",
    phone: "010-2345-6789",
    growth_stage: "poc",
    revenue_range: "none",
    growth_trend: "too_early",
    priorities: ["market_customer", "product_tech"],
    goals:
      "12개월 목표: PMF 확인 + 유료 고객 20곳.\n확인하고 싶은 내용: 프리미엄 vs 프리 모델 방향성.",
    channel: "search",
    files: {
      ir_deck: { name: "FlexLab_intro_v1.pdf", url: "#", size_mb: 5.1 },
      business_cert: null,
      company_intro: null,
    },
    reviewer: null,
    review_deadline: "2026-08-07",
    ai_summary: null,
    review_notes: null,
    decided_at: null,
  },
  {
    id: "app-2026-0040",
    application_no: "HEIM-APP-2026-0040",
    received_at: "2026-07-30T11:05:00+09:00",
    status: "go",
    company_name: "퀀텀브릿지",
    business_number: "345-67-89012",
    ceo_name: "최민혁",
    headcount: 18,
    website: "https://quantumbridge.example.com",
    tagline: "양자 컴퓨팅 시뮬레이션 SDK · B2B 라이선스",
    contact_name: "최민혁",
    contact_role: "CEO",
    email: "minhyeok@quantumbridge.example.com",
    phone: "010-3456-7890",
    growth_stage: "recurring",
    revenue_range: "5_to_10",
    growth_trend: "fast_growth",
    priorities: ["fundraising", "hr_org", "strategy"],
    goals: "TIPS 선정 후 시리즈 A 10-15억 규모.",
    channel: "event",
    files: {
      ir_deck: { name: "QB_IR_2026H2.pdf", url: "#", size_mb: 12.2 },
      business_cert: { name: "사업자등록증_퀀텀브릿지.pdf", url: "#", size_mb: 0.4 },
      company_intro: { name: "회사소개서.pdf", url: "#", size_mb: 3.1 },
    },
    reviewer: "강영환",
    review_deadline: "2026-08-06",
    ai_summary: null,
    review_notes:
      "TIPS 3주차 심사 참여 확정. 시리즈 A 리드 투자자 3곳 소싱 착수.",
    decided_at: "2026-07-31T14:30:00+09:00",
  },
  {
    id: "app-2026-0039",
    application_no: "HEIM-APP-2026-0039",
    received_at: "2026-07-29T13:40:00+09:00",
    status: "more_docs",
    company_name: "아토믹스",
    business_number: null,
    ceo_name: "정소연",
    headcount: 4,
    website: null,
    tagline: "동네 자영업자를 위한 소셜 커머스 앱",
    contact_name: "정소연",
    contact_role: "CEO",
    email: "soyeon@atomix.example.com",
    phone: "010-4567-8901",
    growth_stage: "mvp",
    revenue_range: "none",
    growth_trend: "not_tracked",
    priorities: ["revenue_model", "marketing_sales", "market_customer"],
    goals: "PMF 검증 · TIPS 1회 도전.",
    channel: "sns",
    files: {
      ir_deck: { name: "atomix_deck.pdf", url: "#", size_mb: 2.8 },
      business_cert: null,
      company_intro: null,
    },
    reviewer: "기동현",
    review_deadline: "2026-08-05",
    ai_summary: null,
    review_notes: "매출·유저 데이터·시장 규모 자료 보완 필요.",
    decided_at: "2026-07-30T10:15:00+09:00",
  },
  {
    id: "app-2026-0038",
    application_no: "HEIM-APP-2026-0038",
    received_at: "2026-07-28T08:15:00+09:00",
    status: "no_go",
    company_name: "리유즈랩",
    business_number: "456-78-90123",
    ceo_name: "박수민",
    headcount: 2,
    website: null,
    tagline: "온라인 리유즈 마켓플레이스",
    contact_name: "박수민",
    contact_role: "대표",
    email: "sumin@reuselab.example.com",
    phone: "010-5678-9012",
    growth_stage: "idea",
    revenue_range: "none",
    growth_trend: "too_early",
    priorities: ["market_customer"],
    goals: "MVP 개발 자금 확보.",
    channel: "search",
    files: {
      ir_deck: { name: "reuselab.pdf", url: "#", size_mb: 1.5 },
      business_cert: null,
      company_intro: null,
    },
    reviewer: "강영환",
    review_deadline: "2026-08-04",
    ai_summary: null,
    review_notes:
      "당사 서비스 라인업 (딥테크·초기 매출 이상 스타트업 대상)과 부적합. 이후 트랙션 확보 시 재접수 안내.",
    decided_at: "2026-07-29T16:00:00+09:00",
  },
];

export function findApplicationById(id: string): Application | null {
  return MOCK_APPLICATIONS.find((a) => a.id === id) ?? null;
}
