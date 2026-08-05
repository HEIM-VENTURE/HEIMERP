/**
 * 투자 딜 도메인 mock 데이터.
 * Doc: 프로젝트 아래에 여러 투자 딜이 존재할 수 있음.
 * 각 딜은 여러 투자자에게 동시 태핑 가능.
 */

export type Round =
  | "seed"
  | "pre_a"
  | "series_a"
  | "series_b"
  | "bridge"
  | "convertible";

export type DealStage =
  | "prep"        // 준비
  | "tapping"     // 태핑
  | "meeting"     // 미팅 진행
  | "term_sheet"  // 텀시트 협상
  | "ic"          // 투심위
  | "closing"     // 클로징
  | "closed"      // 완료
  | "lost";       // 실패

export type InvestorType = "vc" | "corp" | "angel" | "accelerator" | "family_office";

export type InvestorStatus = "target" | "contacted" | "meeting" | "interested" | "term_sheet" | "committed" | "passed";

export type Investor = {
  id: string;
  name: string;
  type: InvestorType;
  contact_person: string | null;
  status: InvestorStatus;
  proposed_amount: number | null; // 억
  last_touch: string | null;
  note: string | null;
};

export type Deal = {
  id: string;
  code: string;
  project_id: string;
  project_name: string;
  company_id: string;
  company_name: string;
  round: Round;
  target_amount: number; // 억
  min_amount: number | null;
  actual_amount: number | null;
  pre_valuation: number | null; // 억
  stage: DealStage;
  lead_investor: string | null;
  investors: Investor[];
  next_action: string | null;
  next_action_date: string | null;
  ic_count: number;
  pm: string;
  opened_at: string;
  target_close: string | null;
  closed_at: string | null;
  notes: string | null;
};

export const ROUND_LABEL: Record<Round, string> = {
  seed: "시드",
  pre_a: "Pre-A",
  series_a: "시리즈 A",
  series_b: "시리즈 B",
  bridge: "브릿지",
  convertible: "전환사채",
};

export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  prep: "준비",
  tapping: "태핑",
  meeting: "미팅",
  term_sheet: "텀시트 협상",
  ic: "투심위",
  closing: "클로징",
  closed: "완료",
  lost: "실패",
};

export const DEAL_STAGE_COLOR: Record<
  DealStage,
  { bg: string; text: string; dot: string }
> = {
  prep: { bg: "#F0F1F3", text: "#4B5563", dot: "#9CA3AF" },
  tapping: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  meeting: { bg: "#DDD6FE", text: "#5B21B6", dot: "#8B5CF6" },
  term_sheet: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  ic: { bg: "#FCE7F3", text: "#9D174D", dot: "#EC4899" },
  closing: { bg: "#CCFBF1", text: "#115E59", dot: "#14B8A6" },
  closed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  lost: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

export const INVESTOR_TYPE_LABEL: Record<InvestorType, string> = {
  vc: "VC",
  corp: "전략적 · CVC",
  angel: "엔젤",
  accelerator: "액셀러레이터",
  family_office: "패밀리오피스",
};

export const INVESTOR_STATUS_LABEL: Record<InvestorStatus, string> = {
  target: "타겟",
  contacted: "접촉",
  meeting: "미팅",
  interested: "관심",
  term_sheet: "텀시트",
  committed: "커밋",
  passed: "패스",
};

export const INVESTOR_STATUS_COLOR: Record<
  InvestorStatus,
  { bg: string; text: string }
> = {
  target: { bg: "#F3F4F6", text: "#6B7280" },
  contacted: { bg: "#DBEAFE", text: "#1E40AF" },
  meeting: { bg: "#EDE9FE", text: "#5B21B6" },
  interested: { bg: "#FEF3C7", text: "#92400E" },
  term_sheet: { bg: "#FED7AA", text: "#9A3412" },
  committed: { bg: "#D1FAE5", text: "#065F46" },
  passed: { bg: "#FEE2E2", text: "#991B1B" },
};

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────
export const MOCK_DEALS: Deal[] = [
  {
    id: "deal-2026-0012",
    code: "DEAL-2026-0012",
    project_id: "proj-2026-0029",
    project_name: "퀀텀브릿지 시리즈 A 10-15억 유치",
    company_id: "co-quantum",
    company_name: "퀀텀브릿지",
    round: "series_a",
    target_amount: 12,
    min_amount: 10,
    actual_amount: null,
    pre_valuation: 60,
    stage: "term_sheet",
    lead_investor: "KTB네트워크",
    investors: [
      {
        id: "inv-1",
        name: "KTB네트워크",
        type: "vc",
        contact_person: "박정민 심사역",
        status: "term_sheet",
        proposed_amount: 5,
        last_touch: "2026-08-01",
        note: "리드 후보. 텀시트 초안 검토 중.",
      },
      {
        id: "inv-2",
        name: "카카오벤처스",
        type: "vc",
        contact_person: "이지훈 파트너",
        status: "interested",
        proposed_amount: 3,
        last_touch: "2026-07-28",
        note: "관심 표명. 다음 주 파트너 미팅.",
      },
      {
        id: "inv-3",
        name: "삼성벤처투자",
        type: "corp",
        contact_person: "김세영 심사역",
        status: "meeting",
        proposed_amount: 3,
        last_touch: "2026-07-25",
        note: "1차 미팅 완료. 실사 진행.",
      },
      {
        id: "inv-4",
        name: "네이버 D2SF",
        type: "corp",
        contact_person: "정하늘",
        status: "contacted",
        proposed_amount: 2,
        last_touch: "2026-07-20",
        note: "미팅 일정 조율 중.",
      },
      {
        id: "inv-5",
        name: "본엔젤스벤처파트너스",
        type: "vc",
        contact_person: "장태원",
        status: "passed",
        proposed_amount: null,
        last_touch: "2026-07-18",
        note: "포트폴리오 겹침으로 패스.",
      },
      {
        id: "inv-6",
        name: "스톤브릿지벤처스",
        type: "vc",
        contact_person: "최민석 심사역",
        status: "target",
        proposed_amount: null,
        last_touch: null,
        note: "리스트 등록. 이번 주 소개 예정.",
      },
    ],
    next_action: "KTB네트워크 텀시트 최종본 대응",
    next_action_date: "2026-08-10",
    ic_count: 2,
    pm: "강영환",
    opened_at: "2026-07-01",
    target_close: "2026-11-30",
    closed_at: null,
    notes:
      "리드 후보 3곳 (KTB · 카카오 · 삼성). 텀시트 협상 중. 8월 말 IC 예정.",
  },
  {
    id: "deal-2026-0011",
    code: "DEAL-2026-0011",
    project_id: "proj-neurofit-fundraising",
    project_name: "뉴로핏 시드 유치",
    company_id: "co-neurofit",
    company_name: "뉴로핏",
    round: "seed",
    target_amount: 5,
    min_amount: 3,
    actual_amount: null,
    pre_valuation: 25,
    stage: "tapping",
    lead_investor: null,
    investors: [
      {
        id: "inv-11",
        name: "매쉬업엔젤스",
        type: "accelerator",
        contact_person: "김지원",
        status: "meeting",
        proposed_amount: 1,
        last_touch: "2026-08-02",
        note: "1차 미팅 완료. 자료 요청 전달.",
      },
      {
        id: "inv-12",
        name: "본엔젤스",
        type: "angel",
        contact_person: null,
        status: "contacted",
        proposed_amount: null,
        last_touch: "2026-07-30",
        note: null,
      },
      {
        id: "inv-13",
        name: "프라이머사제파트너스",
        type: "vc",
        contact_person: "이재웅 심사역",
        status: "target",
        proposed_amount: null,
        last_touch: null,
        note: "이번 주 소개 예정",
      },
    ],
    next_action: "IR Deck 완성 후 다음 라운드 태핑 시작",
    next_action_date: "2026-08-15",
    ic_count: 0,
    pm: "허유나",
    opened_at: "2026-07-25",
    target_close: "2026-12-31",
    closed_at: null,
    notes: null,
  },
  {
    id: "deal-2026-0010",
    code: "DEAL-2026-0010",
    project_id: "proj-quantum-bridge",
    project_name: "퀀텀브릿지 브릿지 라운드",
    company_id: "co-quantum",
    company_name: "퀀텀브릿지",
    round: "bridge",
    target_amount: 3,
    min_amount: 2,
    actual_amount: 3,
    pre_valuation: 40,
    stage: "closed",
    lead_investor: "카카오벤처스",
    investors: [
      {
        id: "inv-21",
        name: "카카오벤처스",
        type: "vc",
        contact_person: "이지훈",
        status: "committed",
        proposed_amount: 2,
        last_touch: "2026-05-15",
        note: "리드로 참여. 이후 시리즈 A도 검토.",
      },
      {
        id: "inv-22",
        name: "엔젤 개인",
        type: "angel",
        contact_person: "김창섭",
        status: "committed",
        proposed_amount: 1,
        last_touch: "2026-05-10",
        note: null,
      },
    ],
    next_action: null,
    next_action_date: null,
    ic_count: 1,
    pm: "강영환",
    opened_at: "2026-03-20",
    target_close: "2026-05-31",
    closed_at: "2026-05-20",
    notes: "브릿지 라운드 성공적 마감. 시리즈 A 준비로 이어짐.",
  },
];

export function findDealById(id: string): Deal | null {
  return MOCK_DEALS.find((d) => d.id === id) ?? null;
}
