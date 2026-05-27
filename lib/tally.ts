/**
 * Tally Webhook 페이로드 파싱 유틸.
 * Tally Webhook 페이로드 구조:
 * {
 *   eventId, eventType: "FORM_RESPONSE", createdAt, formId,
 *   data: {
 *     responseId, submissionId, respondentId, formId, formName, createdAt,
 *     fields: [{ key, label, type, value }]
 *   }
 * }
 */

export type TallyField = {
  key?: string;
  label?: string;
  type?: string;
  value?: unknown;
};

export type TallyPayload = {
  eventId?: string;
  eventType?: string;
  createdAt?: string;
  formId?: string;
  data?: {
    responseId?: string;
    submissionId?: string;
    formId?: string;
    formName?: string;
    createdAt?: string;
    fields?: TallyField[];
  };
};

/**
 * payload에서 특정 라벨의 값을 추출.
 * 라벨 매칭은 트림+소문자 비교 (사용자가 Tally에서 약간 변경해도 견고).
 */
export function getField(payload: TallyPayload, label: string): string | null {
  const fields = payload?.data?.fields ?? [];
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
  const target = norm(label);
  const found = fields.find((f) => f.label && norm(f.label) === target);
  if (!found || found.value == null) return null;
  if (typeof found.value === "string") return found.value.trim() || null;
  if (typeof found.value === "number") return String(found.value);
  if (Array.isArray(found.value)) {
    return found.value.map((v: any) => (typeof v === "object" ? v.text ?? v.label ?? "" : String(v))).join(", ");
  }
  if (typeof found.value === "object") {
    const v = found.value as Record<string, unknown>;
    if (typeof v.text === "string") return v.text;
    if (typeof v.label === "string") return v.label;
  }
  return String(found.value);
}

export function getFieldNumber(payload: TallyPayload, label: string): number | null {
  const raw = getField(payload, label);
  if (!raw) return null;
  const num = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

export function getFieldDate(payload: TallyPayload, label: string): string | null {
  const raw = getField(payload, label);
  if (!raw) return null;
  // Tally는 보통 YYYY-MM-DD 또는 ISO 형식
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

export function getResponseId(payload: TallyPayload): string | null {
  return payload?.data?.responseId ?? payload?.data?.submissionId ?? null;
}

/**
 * URL ?secret=... 또는 header X-Webhook-Secret 으로 시크릿 검증.
 */
export function verifyTallySecret(req: Request): boolean {
  const expected = process.env.TALLY_WEBHOOK_SECRET;
  if (!expected) return false;
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("secret");
  const fromHeader = req.headers.get("x-webhook-secret");
  return fromQuery === expected || fromHeader === expected;
}
