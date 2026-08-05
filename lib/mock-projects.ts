/**
 * 프로젝트 도메인 UI 껍데기용 mock 데이터.
 * Doc의 핵심 구조: 한 기업 → 여러 프로젝트.
 * 나중에 Supabase projects 테이블로 이관 예정.
 */

export type ProjectType =
  | "tips"           // TIPS 지원
  | "ir_deck"        // IR Deck 고도화
  | "fundraising"    // 투자 유치
  | "growth_strategy"// 성장 전략
  | "ipo_strategy"   // 5개년 성장·IPO
  | "followup";      // 후속 투자유치

export type ProjectStage =
  | "prep"       // 준비
  | "active"     // 진행 중
  | "review"     // 검토·산출물 전달
  | "closing"    // 마무리
  | "done"       // 완료
  | "on_hold";   // 보류

export type Project = {
  id: string;
  code: string; // 예: PROJ-2026-0031
  company_id: string;
  company_name: string;
  type: ProjectType;
  name: string;
  stage: ProjectStage;
  pm: string;
  team: string[];
  started_at: string;
  target_end: string;
  contract_amount: number | null; // 만원
  progress: number; // 0-100
  next_milestone: string | null;
  next_milestone_date: string | null;
  open_tasks: number;
  meetings_count: number;
  files_count: number;
  investment_deal_count: number;
  notes: string | null;
};

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  tips: "TIPS 지원",
  ir_deck: "IR Deck 고도화",
  fundraising: "투자 유치",
  growth_strategy: "성장 전략",
  ipo_strategy: "5개년 · IPO 전략",
  followup: "후속 투자유치",
};

export const PROJECT_TYPE_COLOR: Record<
  ProjectType,
  { bg: string; text: string; dot: string }
> = {
  tips: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  ir_deck: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  fundraising: { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
  growth_strategy: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  ipo_strategy: { bg: "#FCE7F3", text: "#9D174D", dot: "#EC4899" },
  followup: { bg: "#F3E8FF", text: "#6B21A8", dot: "#A855F7" },
};

export const PROJECT_STAGE_LABEL: Record<ProjectStage, string> = {
  prep: "준비",
  active: "진행 중",
  review: "검토·산출물",
  closing: "마무리",
  done: "완료",
  on_hold: "보류",
};

export const PROJECT_STAGE_COLOR: Record<
  ProjectStage,
  { bg: string; text: string; dot: string }
> = {
  prep: { bg: "#F0F1F3", text: "#4B5563", dot: "#9CA3AF" },
  active: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  review: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  closing: { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
  done: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  on_hold: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────
export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-2026-0031",
    code: "PROJ-2026-0031",
    company_id: "co-neurofit",
    company_name: "뉴로핏",
    type: "tips",
    name: "뉴로핏 TIPS 26년 3차 라운드 지원",
    stage: "active",
    pm: "허유나",
    team: ["허유나", "기동현"],
    started_at: "2026-07-15",
    target_end: "2026-10-30",
    contract_amount: 3000,
    progress: 45,
    next_milestone: "TIPS 운영사 IR (오르빗파트너스)",
    next_milestone_date: "2026-08-12",
    open_tasks: 8,
    meetings_count: 4,
    files_count: 14,
    investment_deal_count: 0,
    notes: "MFDS 로드맵 자료 보완 필요. 8/10까지 사업계획서 최종본.",
  },
  {
    id: "proj-2026-0030",
    code: "PROJ-2026-0030",
    company_id: "co-neurofit",
    company_name: "뉴로핏",
    type: "ir_deck",
    name: "뉴로핏 IR Deck v4 고도화",
    stage: "review",
    pm: "기동현",
    team: ["기동현"],
    started_at: "2026-06-20",
    target_end: "2026-08-15",
    contract_amount: 1200,
    progress: 78,
    next_milestone: "최종본 대표 리뷰",
    next_milestone_date: "2026-08-08",
    open_tasks: 3,
    meetings_count: 6,
    files_count: 9,
    investment_deal_count: 0,
    notes: null,
  },
  {
    id: "proj-2026-0029",
    code: "PROJ-2026-0029",
    company_id: "co-quantum",
    company_name: "퀀텀브릿지",
    type: "fundraising",
    name: "퀀텀브릿지 시리즈 A 10-15억 유치",
    stage: "active",
    pm: "강영환",
    team: ["강영환", "허유나"],
    started_at: "2026-07-01",
    target_end: "2026-12-31",
    contract_amount: 5000,
    progress: 30,
    next_milestone: "리드 투자자 태핑 (KTB네트워크)",
    next_milestone_date: "2026-08-14",
    open_tasks: 12,
    meetings_count: 5,
    files_count: 22,
    investment_deal_count: 3,
    notes: "리드 후보 3곳 초기 접촉. 텀시트 협상 준비.",
  },
  {
    id: "proj-2026-0028",
    code: "PROJ-2026-0028",
    company_id: "co-quantum",
    company_name: "퀀텀브릿지",
    type: "tips",
    name: "퀀텀브릿지 TIPS 지원 (완료)",
    stage: "done",
    pm: "강영환",
    team: ["강영환"],
    started_at: "2026-03-10",
    target_end: "2026-07-15",
    contract_amount: 3000,
    progress: 100,
    next_milestone: null,
    next_milestone_date: null,
    open_tasks: 0,
    meetings_count: 9,
    files_count: 31,
    investment_deal_count: 0,
    notes: "TIPS 최종 선정. 다음 라운드: 시리즈 A.",
  },
  {
    id: "proj-2026-0027",
    code: "PROJ-2026-0027",
    company_id: "co-flexlab",
    company_name: "플렉스랩",
    type: "growth_strategy",
    name: "플렉스랩 PMF 검증 · 초기 GTM",
    stage: "prep",
    pm: "기동현",
    team: ["기동현"],
    started_at: "2026-08-05",
    target_end: "2026-11-30",
    contract_amount: 800,
    progress: 5,
    next_milestone: "킥오프 미팅",
    next_milestone_date: "2026-08-07",
    open_tasks: 5,
    meetings_count: 0,
    files_count: 2,
    investment_deal_count: 0,
    notes: "계약서 체결 완료. 킥오프 예정.",
  },
  {
    id: "proj-2026-0026",
    code: "PROJ-2026-0026",
    company_id: "co-atomix",
    company_name: "아토믹스",
    type: "growth_strategy",
    name: "아토믹스 리포지셔닝 컨설팅",
    stage: "on_hold",
    pm: "허유나",
    team: ["허유나"],
    started_at: "2026-05-15",
    target_end: "2026-08-30",
    contract_amount: 500,
    progress: 40,
    next_milestone: "고객 인터뷰 재개",
    next_milestone_date: null,
    open_tasks: 2,
    meetings_count: 3,
    files_count: 7,
    investment_deal_count: 0,
    notes: "고객측 자료 미제출로 보류 중. 8월 중 재개 예정.",
  },
];

export function findProjectById(id: string): Project | null {
  return MOCK_PROJECTS.find((p) => p.id === id) ?? null;
}
