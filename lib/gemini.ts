/**
 * Google Gemini API 통합 - 회의록 자동 요약 + To-do 추출.
 * 무료 티어: 분 15회 / 일 1500회 (사실상 무제한).
 */
import { GoogleGenAI } from "@google/genai";

// 우선순위 순서로 시도 (앞 모델 실패 시 다음 모델로 폴백).
// gemini-2.0-flash-exp 는 폐기됨(404). 2.5-flash 가 현재 무료 안정 버전.
const MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

export type MeetingSummary = {
  summary: string; // 상세 회의록 마크다운
  todos: string[]; // 대표님 관점 액션 아이템
};

export async function summarizeMeetingNotes(
  body: string,
  context?: { companyName?: string; meetingType?: string; attendees?: string }
): Promise<MeetingSummary> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY 환경변수가 없습니다");
  }

  const ai = new GoogleGenAI({ apiKey });

  const contextLine = context
    ? `회사: ${context.companyName ?? "—"} | 미팅 유형: ${context.meetingType ?? "—"}${context.attendees ? ` | 참석자: ${context.attendees}` : ""}`
    : "";

  const prompt = `너는 하임벤처투자(스타트업 컨설팅 회사)의 회의록 정리 어시스턴트야.
아래 녹취록/대화 내용을 바탕으로 지정된 목차와 양식에 맞추어 상세 회의록을 작성해.

[중요 규칙]
1. 내용을 임의로 지어내거나 섞지 마. 대화 내용에 근거해서만 작성.
2. 추측 금지 — 녹취록에 없는 내용은 추가하지 마.
3. 사람 이름·날짜·금액 같은 구체 정보는 보존.
4. 'To-do' 항목은 대표(의사결정권자) 관점에서 직접 챙기고 지시해야 할 액션 아이템으로 작성.
5. 결과는 반드시 아래 JSON 형식으로만 출력. 다른 텍스트·코드펜스 없이 순수 JSON만.

[JSON 출력 형식]
{
  "summary": "아래 [회의록 작성 양식] 그대로 채운 마크다운 전체 문자열",
  "todos": ["대표님이 직접 챙길 액션 1", "액션 2", "..."]
}

- "summary"에는 아래 양식을 빠짐없이 마크다운으로 채워 넣어. (## 제목들 유지)
- "todos"에는 '대표님 (To-do)' 섹션의 각 항목을 짧고 실행 가능한 한 문장씩 배열로 분리해서 넣어. 없으면 빈 배열.

[회의록 작성 양식]
# 회의록(상세 정리)

## 1. 논의 배경/핵심 문제의식
* (현재 상황, 미팅이 열리게 된 배경, 해결해야 할 주요 문제점 요약)

## 2. 제안/전략 방향
* (미팅에서 제시된 해결책, 사업 전략, 향후 나아갈 방향 요약)

## 3. 제품(솔루션/플랫폼) 구상
* (논의된 제품, 서비스, 솔루션의 핵심 기능이나 특징 요약)

## 4. 확인이 필요한 포인트(후속 질문)
* (명확히 결론 나지 않은 사항, 추가 확인·조사가 필요한 질문 요약)

## 5. 대표님 (To-do)
* (대표/의사결정권자 관점에서 직접 챙기고 지시해야 할 필수 액션 아이템)

---

## 대화 내용(녹취) 정리

### 1. 핵심 요약
* **미팅 목적:** (이 미팅의 궁극적 목적 1~2줄)
* **현재 핵심 자산 및 상황:** (보유 강점·무기·처한 구체 상황)
* **사업화 논점:** (투자 유치, 수익 모델, 규제 돌파, 협력 방식 등 핵심 쟁점)

### 2. 상세 정리(주제별)
* (시간순 나열이 아닌 핵심 주제별로 묶어 상세 요약)

### 3. 의사결정/합의 (대화에서 드러난 수준)
* (동의했거나 추진하기로 결정된 사항)

### 4. 다음에 확인/요청할 자료 (회의 후속)
* (다음 미팅 전까지 준비·공유하기로 한 문서/데이터)

${contextLine ? `[회의 컨텍스트]\n${contextLine}\n` : ""}
[녹취록 원문]
${body}`;

  let lastError: unknown = null;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      const text = response.text;
      if (text && text.trim()) {
        return parseSummary(text.trim());
      }
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

/**
 * Gemini 응답(JSON 기대)을 안전하게 파싱.
 * JSON 파싱 실패 시 전체 텍스트를 summary로, todos는 빈 배열로 폴백.
 */
function parseSummary(text: string): MeetingSummary {
  // 혹시 ```json ... ``` 코드펜스로 감싸 나온 경우 제거
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const obj = JSON.parse(cleaned);
    const summary = typeof obj.summary === "string" ? obj.summary.trim() : cleaned;
    const todos = Array.isArray(obj.todos)
      ? obj.todos
          .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
          .filter((t: string) => t.length > 0)
      : [];
    return { summary, todos };
  } catch {
    // JSON이 아니면 통째로 요약 처리
    return { summary: cleaned, todos: [] };
  }
}
