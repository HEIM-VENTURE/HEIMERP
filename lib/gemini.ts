/**
 * Google Gemini API 통합 - 회의록 자동 요약 + To-do 추출.
 * 무료 티어: 분 15회 / 일 1500회 (사실상 무제한).
 *
 * SDK 대신 REST(fetch)로 직접 호출 — 서버 환경(Netlify)에서 SDK 인증 이슈를
 * 피하고, API 키의 공백·줄바꿈을 방어적으로 trim 처리하기 위함.
 *
 * 출력은 JSON이 아니라 '마크다운'으로 받음 — 모델이 긴 한국어 문자열에서
 * 따옴표 이스케이프를 자주 틀려 JSON 파싱이 깨지기 때문. 마크다운을 그대로
 * 저장/렌더하고, To-do는 '대표님 (To-do)' 섹션을 파싱해서 추출.
 */

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
  // 환경변수에 줄바꿈·따옴표·공백이 섞여 들어오는 경우가 잦아 방어적으로 정리
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
5. 출력은 아래 양식 그대로의 '마크다운'만. 다른 안내문·코드펜스(\`\`\`) 없이 마크다운 본문만 출력.
6. '## 5. 대표님 (To-do)' 섹션에는 각 액션을 한 줄씩 '* '로 시작하는 불릿으로 작성 (실행 가능한 한 문장).

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

  const keyHint = `key[len=${apiKey.length},head=${apiKey.slice(0, 4)}]`;
  let lastError = "";

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const apiMsg = data?.error?.message || `(빈 메시지, HTTP ${res.status})`;
        lastError = `[${model}] HTTP ${res.status}: ${apiMsg}`;
        continue; // 다음 모델로 폴백
      }

      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? undefined;

      if (text && text.trim()) {
        const summary = stripFences(text.trim());
        return { summary, todos: extractTodos(summary) };
      }
      lastError = `[${model}] 빈 응답`;
    } catch (e) {
      lastError = `[${model}] ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  if (lastError.includes("401") || lastError.includes("403") || lastError.includes("API key")) {
    throw new Error(
      `Gemini 인증 실패 — API 키가 잘못되었거나 권한이 없습니다. (${keyHint}) 상세: ${lastError}`
    );
  }
  throw new Error(`Gemini 요약 실패 (모든 모델 시도): ${lastError || "알 수 없는 오류"}`);
}

/** 혹시 ```markdown ... ``` 코드펜스로 감싸 나오면 제거 */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * 마크다운에서 '대표님 (To-do)' 섹션의 불릿들을 추출.
 * '## 5. 대표님 (To-do)' (숫자·기호 유연) 다음부터 다음 헤딩/구분선 전까지의 불릿 라인.
 */
function extractTodos(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const todos: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // To-do 섹션 헤딩 진입 (예: "## 5. 대표님 (To-do)", "## 대표님 To-do")
    if (/^#{1,6}\s.*대표님.*to-?do/i.test(trimmed)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      // 다음 헤딩이나 구분선이면 섹션 종료
      if (/^#{1,6}\s/.test(trimmed) || /^-{3,}$/.test(trimmed)) break;
      // 불릿 라인 추출
      const m = trimmed.match(/^[*\-]\s+(.+)$/);
      if (m) {
        const item = m[1].replace(/\*\*/g, "").trim(); // 볼드 마크 제거
        // 양식 안내문(괄호로 시작)·없음 표기는 제외
        if (item && !/^\(.*\)$/.test(item) && !/^없[음다]/.test(item)) {
          todos.push(item);
        }
      }
    }
  }

  return todos;
}
