/**
 * Google Gemini API 통합 - 회의록 자동 요약.
 * 무료 티어: 분 15회 / 일 1500회 (사실상 무제한).
 */
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.0-flash-exp";

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

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini 응답이 비어있습니다");
  }
  return text.trim();
}
