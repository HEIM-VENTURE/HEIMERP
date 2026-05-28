/**
 * Google Gemini API 통합 - 회의록 자동 요약 + To-do 추출.
 * 무료 티어: 분 15회 / 일 1500회 (사실상 무제한).
 *
 * 설계 메모:
 * - SDK 대신 REST(fetch)로 직접 호출 — 서버(Netlify) 인증 이슈 회피 + 키 trim.
 * - 출력은 JSON이 아니라 '마크다운' — 모델이 긴 한국어에서 따옴표 이스케이프를
 *   자주 틀려 JSON 파싱이 깨지기 때문. To-do는 마크다운 섹션을 파싱해 추출.
 * - 모델은 'flash-lite' + thinking off — Netlify 서버리스 함수 시간제한(~10초)을
 *   넘기지 않도록 빠른 모델 사용. (2.5-flash는 33초까지 걸려 타임아웃 발생함)
 * - 전체 데드라인(AbortController)으로 묶어 함수가 죽지 않고 깔끔히 실패하게.
 */

// thinking off + 빠른 모델 순. 앞 모델 실패 시 다음으로 폴백.
const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];

// 전체 생성에 허용할 최대 시간.
// - 운영(Netlify): 함수 시간제한(~10초)보다 안전하게 9초.
// - 개발(localhost): 시간제한이 없으므로 넉넉히 60초 (기능 검증용).
const OVERALL_DEADLINE_MS = process.env.NODE_ENV === "production" ? 9000 : 60000;

export type MeetingSummary = {
  summary: string; // 상세 회의록 마크다운
  todos: string[]; // 대표님 관점 액션 아이템
};

export async function summarizeMeetingNotes(
  body: string,
  context?: { companyName?: string; meetingType?: string; attendees?: string }
): Promise<MeetingSummary> {
  const rawKey = process.env.GOOGLE_GENAI_API_KEY ?? "";
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, "");
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY 환경변수가 없습니다");
  }

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
5. 출력은 아래 양식 그대로의 '마크다운'만. 다른 안내문·코드펜스 없이 마크다운 본문만.
6. '## 5. 대표님 (To-do)' 섹션에는 각 액션을 '* '로 시작하는 불릿 한 줄씩 (실행 가능한 한 문장).

[회의록 작성 양식]
# 회의록(상세 정리)

## 1. 논의 배경/핵심 문제의식
* (현재 상황, 미팅 배경, 주요 문제점)

## 2. 제안/전략 방향
* (해결책, 사업 전략, 향후 방향)

## 3. 제품(솔루션/플랫폼) 구상
* (논의된 제품·서비스의 핵심 기능/특징)

## 4. 확인이 필요한 포인트(후속 질문)
* (결론 안 난 사항, 추가 확인·조사 필요 질문)

## 5. 대표님 (To-do)
* (대표가 직접 챙기고 지시할 필수 액션 아이템)

---

## 대화 내용(녹취) 정리

### 1. 핵심 요약
* **미팅 목적:** (궁극적 목적 1~2줄)
* **현재 핵심 자산 및 상황:** (강점·무기·처한 상황)
* **사업화 논점:** (투자, 수익 모델, 규제, 협력 등 쟁점)

### 2. 상세 정리(주제별)
* (핵심 주제별로 묶어 요약)

### 3. 의사결정/합의
* (동의·추진 결정 사항)

### 4. 다음에 확인/요청할 자료
* (준비·공유하기로 한 문서/데이터)

${contextLine ? `[회의 컨텍스트]\n${contextLine}\n` : ""}
[녹취록 원문]
${body}`;

  const keyHint = `key[len=${apiKey.length},head=${apiKey.slice(0, 4)}]`;
  const startedAt = Date.now();
  let lastError = "";

  for (const model of MODELS) {
    const remaining = OVERALL_DEADLINE_MS - (Date.now() - startedAt);
    if (remaining < 2500) break; // 남은 예산 부족하면 폴백 중단

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
          }),
          signal: controller.signal,
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const apiMsg = data?.error?.message || `(빈 메시지, HTTP ${res.status})`;
        lastError = `[${model}] HTTP ${res.status}: ${apiMsg}`;
        continue;
      }

      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? undefined;

      if (text && text.trim()) {
        const summary = stripFences(text.trim());
        return { summary, todos: extractTodos(summary) };
      }
      lastError = `[${model}] 빈 응답`;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        lastError = `[${model}] 시간 초과(${Math.round(remaining / 1000)}초)`;
      } else {
        lastError = `[${model}] ${e instanceof Error ? e.message : String(e)}`;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError.includes("401") || lastError.includes("403") || lastError.includes("API key")) {
    throw new Error(
      `Gemini 인증 실패 — API 키가 잘못되었거나 권한이 없습니다. (${keyHint}) 상세: ${lastError}`
    );
  }
  throw new Error(`Gemini 요약 실패: ${lastError || "알 수 없는 오류"}`);
}

/** 코드펜스 제거 */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * 마크다운에서 '대표님 (To-do)' 섹션의 불릿들을 추출.
 */
function extractTodos(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const todos: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^#{1,6}\s.*대표님.*to-?do/i.test(trimmed)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      if (/^#{1,6}\s/.test(trimmed) || /^-{3,}$/.test(trimmed)) break;
      const m = trimmed.match(/^[*\-]\s+(.+)$/);
      if (m) {
        const item = m[1]
          .replace(/^\[[ xX]?\]\s*/, "") // '[ ]' / '[x]' 체크박스 표기 제거
          .replace(/\*\*/g, "") // 볼드 마크 제거
          .trim();
        if (item && !/^\(.*\)$/.test(item) && !/^없[음다]/.test(item)) {
          todos.push(item);
        }
      }
    }
  }

  return todos;
}
