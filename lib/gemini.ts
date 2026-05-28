/**
 * Google Gemini API 통합 - 회의록 자동 요약.
 * 무료 티어: 분 15회 / 일 1500회 (사실상 무제한).
 */
import { GoogleGenAI } from "@google/genai";

// 우선순위 순서로 시도 (앞 모델 실패 시 다음 모델로 폴백).
// gemini-2.0-flash-exp 는 폐기됨(404). 2.5-flash 가 현재 무료 안정 버전.
const MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

export async function summarizeMeetingNotes(
  body: string,
  context?: { companyName?: string; meetingType?: string; attendees?: string }
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY 환경변수가 없습니다");
  }

  const ai = new GoogleGenAI({ apiKey });

  const contextLine = context
    ? `회사: ${context.companyName ?? "—"} | 미팅 유형: ${context.meetingType ?? "—"}${context.attendees ? ` | 참석자: ${context.attendees}` : ""}`
    : "";

  const prompt = `너는 하임벤처투자(스타트업 컨설팅 회사)의 회의록 요약 어시스턴트야.
아래 회의록을 한국어로 요약해.

요약 규칙:
1. 5~10줄 이내, 불릿 포인트 형식
2. 핵심 결정사항·다음 액션·이슈를 우선
3. 사람 이름·날짜·금액 같은 구체적 정보 보존
4. 추측 금지 (회의록에 없는 내용 추가 X)
5. "회의 요약" 같은 메타 제목 없이 바로 본문만

${contextLine ? `[회의 컨텍스트]\n${contextLine}\n` : ""}
[회의록 원문]
${body}

[요약]`;

  let lastError: unknown = null;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      const text = response.text;
      if (text && text.trim()) return text.trim();
      lastError = new Error(`${model}: 빈 응답`);
    } catch (e) {
      lastError = e;
      // 다음 모델로 폴백 (404=모델없음, 429=쿼터초과 등)
    }
  }

  const msg =
    lastError instanceof Error ? lastError.message : String(lastError ?? "알 수 없는 오류");
  throw new Error(`Gemini 요약 실패 (모든 모델 시도): ${msg}`);
}
