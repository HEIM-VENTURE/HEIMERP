// 파일명으로 하임 준비서류 10종 kind 자동 매칭

export const KIND_PATTERNS: { kind: string; patterns: RegExp[] }[] = [
  { kind: "business_cert", patterns: [/사업자등록증|사업자\s*등록/i] },
  { kind: "corp_registry", patterns: [/법인등기|등기부등본/i] },
  { kind: "shareholders", patterns: [/주주명부/i] },
  { kind: "insurance_members", patterns: [/4대보험|가입자명부/i] },
  { kind: "small_biz_cert", patterns: [/소상공인/i] },
  { kind: "financial", patterns: [/재무제표|손익계산|대차대조|재무/i] },
  { kind: "vat_cert", patterns: [/부가세|과세표준/i] },
  { kind: "revenue_forecast", patterns: [/예상\s*매출|매출\s*계획|매출\s*전망/i] },
  { kind: "company_intro", patterns: [/회사\s*소개|소개서|회사\s*개요/i] },
  { kind: "exec_profile", patterns: [/경영진|이력서?|프로필|대표.*이력/i] },
];

/** 파일명으로 kind 추론 (못 찾으면 null) */
export function inferKindFromFilename(filename: string): string | null {
  const name = filename;
  for (const { kind, patterns } of KIND_PATTERNS) {
    for (const re of patterns) {
      if (re.test(name)) return kind;
    }
  }
  return null;
}
