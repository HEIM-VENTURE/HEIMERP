/**
 * UI 라벨 매핑.
 * DB 컬럼·enum 값은 영어, 화면에 보이는 라벨은 한국어.
 * 컬럼 이름이 바뀔 일은 거의 없으니 한 곳에서 관리.
 */

// ===== 사용자 역할 =====
export const ROLE_LABELS = {
  admin: "관리자",
  company_member: "기업",
} as const;

// ===== 영업 단계 =====
export const SALES_STAGE_LABELS = {
  received: "접수",
  meeting_1st: "1차 미팅",
  proposal: "제안",
  contract: "계약",
  kickoff: "착수",
} as const;

export const SALES_STAGES_ORDER = [
  "received",
  "meeting_1st",
  "proposal",
  "contract",
  "kickoff",
] as const;

// 단계 구분 팔레트: 회색→블루→오렌지→그린→로즈.
// blue/emerald/indigo 계열은 @theme override로 모두 블루 램프(steel)에 매핑되므로
// 단계 구분은 slate/blue/orange/green/rose 처럼 서로 다른 계열을 골라 안 겹치게 한다.
export const SALES_STAGE_COLORS = {
  received: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
  meeting_1st: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
  proposal: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700" },
  contract: { dot: "bg-green-500", badge: "bg-green-100 text-green-700" },
  kickoff: { dot: "bg-rose-500", badge: "bg-rose-100 text-rose-700" },
} as const;

// ===== 컨설팅 단계 =====
export const CONSULTING_STAGE_LABELS = {
  kickoff: "착수",
  initial_review: "초기 검토",
  dev_advisory: "개발자문 / 1차 사업계획",
  ir_deck: "IR Deck 작업",
  tips_operator_ir: "TIPS 운영사 IR",
  tips_review: "TIPS 심사",
  fund_closing: "조합 투자절차 Closing",
  final_closing: "Final Closing",
} as const;

export const CONSULTING_STAGES_ORDER = [
  "kickoff",
  "initial_review",
  "dev_advisory",
  "ir_deck",
  "tips_operator_ir",
  "tips_review",
  "fund_closing",
  "final_closing",
] as const;

// ===== 프로그램 등급 =====
export const PROGRAM_GRADE_LABELS = {
  premium: "Premium",
  basic: "Basic",
  free: "Free",
} as const;

export const PROGRAM_GRADE_COLORS = {
  premium: "bg-red-50 text-red-700",
  basic: "bg-yellow-50 text-yellow-700",
  free: "bg-green-50 text-green-700",
} as const;

// ===== To-do 상태 =====
export const TODO_STATUS_LABELS = {
  pending: "대기",
  in_progress: "진행",
  done: "완료",
} as const;

// ===== 계약 지급 상태 =====
export const CONTRACT_PAYMENT_LABELS = {
  scheduled: "지급 예정",
  paid: "지급 완료",
} as const;

// ===== 파일 종류 =====
export const FILE_KIND_LABELS = {
  business_plan: "사업계획서",
  ir_deck: "IR 자료",
  proposal: "제안서",
  quote: "견적서",
  contract: "계약서",
  meeting_notes: "회의록",
  recording: "녹음",
  other: "기타",
} as const;

// ===== 커스텀 필드 타입 =====
export const CUSTOM_FIELD_TYPE_LABELS = {
  text: "텍스트",
  number: "숫자",
  select: "선택지(드롭다운)",
  date: "날짜",
  checkbox: "체크",
  url: "URL",
} as const;

// ===== 컬럼명 영→한 (테이블 헤더용) =====
export const COMPANY_FIELD_LABELS = {
  name: "회사명",
  address: "소재지",
  ceo_name: "대표자명",
  phone: "연락처",
  email: "이메일",
  main_item: "주요 아이템",
  founded_at: "설립일자",
  last_year_revenue: "직전년도 매출액 (백만원)",
  inquiry_purpose: "접수목적",
  proposal_amount: "컨설팅 제안금액",
  fee_rate: "수수료율",
  received_at: "접수일",
  contracted_at: "계약일",
  started_at: "착수일",
} as const;

