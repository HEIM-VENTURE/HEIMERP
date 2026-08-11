# Apps Script 배포 가이드 — 접수 판정 이메일 발송

이 폴더의 `decision-mailer.gs`를 Google Sheets에 붙여 넣고 웹앱으로 배포한다.
Vercel의 판정 저장 서버 액션이 이 웹앱을 호출해 Gmail로 이메일을 발송한다.

## 세팅 순서 (최초 1회)

### 1. 스크립트 붙여넣기

1. 시트 열기: <https://docs.google.com/spreadsheets/d/1SPGdIsCG2CLJi49XKv_TLkpYmbwLg3rs5HkCc_VMiLA/edit>
2. **확장 프로그램 → Apps Script** 클릭
3. 왼쪽 상단 프로젝트명을 `HEIM Decision Mailer` 로 변경 (선택)
4. 기본으로 있는 `function myFunction()` 코드 **전부 지우고**
5. `decision-mailer.gs` 파일 내용 **전체 복사·붙여넣기**
6. **저장** (Ctrl+S)

### 2. 공유 비밀키 설정 (SHARED_SECRET)

Vercel과 Apps Script가 서로만 통신하도록 임의의 비밀 문자열을 정하고 양쪽에 등록한다.

랜덤 문자열 예 (Ctrl+F5 눌러서 새 값):

```
heim-mailer-a8f3c2d9e4b7f1c6d0a2b8e5f9c3d7a4
```

**Apps Script 쪽:**
1. 편집기 왼쪽의 **⚙ 프로젝트 설정** 클릭
2. **스크립트 속성** → **속성 추가**
3. 속성: `SHARED_SECRET`
4. 값: 위 랜덤 문자열
5. **속성 저장**

**Vercel 쪽:**
- **Vercel → heim-erp → Settings → Environment Variables → Add New**
- Key: `APPS_SCRIPT_SHARED_SECRET`
- Value: 같은 랜덤 문자열
- Environments: Production, Preview 체크
- Save

### 3. initSetup 실행 (시트 헤더 자동 생성)

1. Apps Script 편집기 상단 함수 드롭다운에서 **`initSetup`** 선택
2. **실행 (▶)** 클릭
3. 첫 실행이라 권한 승인 창 뜸 → **권한 검토 → 계정 선택 → 고급 → 안전하지 않음(이동) → 허용**
   - "안전하지 않음" 안내는 개인 스크립트라 뜨는 것이며 문제없음
4. 실행 로그에 `initSetup 완료. 시트: EmailQueue` 뜨면 성공
5. 시트로 돌아가면 **EmailQueue** 라는 새 탭에 헤더 10개가 만들어져 있음

### 4. 웹앱으로 배포

1. Apps Script 편집기 우측 상단 **배포 → 새 배포**
2. 톱니바퀴 아이콘 → **유형 선택: 웹 앱**
3. 설정:
   - **설명**: `v1 초기 배포`
   - **다음 사용자로 실행**: `나 (hello@heimvi.com)` — 이 계정 명의로 Gmail 발송됨
   - **액세스 권한이 있는 사용자**: `모든 사용자`
4. **배포** 클릭
5. **웹 앱 URL** 을 복사 (형태: `https://script.google.com/macros/s/XXXXXXXX/exec`)

### 5. Vercel에 웹앱 URL 등록

- **Vercel → heim-erp → Settings → Environment Variables → Add New**
- Key: `APPS_SCRIPT_WEBHOOK_URL`
- Value: 방금 복사한 웹 앱 URL
- Environments: Production, Preview 체크
- Save

### 6. Vercel 재배포 트리거

환경변수 추가 후 다음 배포부터 반영. 강제 재배포:
- Vercel Deployments → 최근 배포의 `⋯` → **Redeploy**

또는 main 브랜치에 아무 커밋이나 push 하면 자동 배포.

## 검증

배포 완료 후 관리자 화면(`/admin/applications/[id]`)에서 **GO** 또는 **자료 요청** 판정 저장:
1. 성공 시 초록 배지 "저장됨 · 이메일은 곧 자동 발송됩니다"
2. 신청자 이메일에 판정 메일 도착 (스팸함도 확인)
3. Google Sheets `EmailQueue` 탭에 새 행이 append 됨 (상태 = 발송완료)
4. Supabase `applications` 테이블에서 해당 행의 `email_sent_at` 컬럼이 채워짐

만약 실패했으면:
- Supabase `applications.email_error` 컬럼에 원인 기록
- Google Sheets `EmailQueue` 마지막 행에 "실패" + 에러 메시지
- Apps Script 편집기 → **실행 → 실행 목록** 에서 로그 확인

## 코드 수정 배포

`decision-mailer.gs`를 수정한 뒤:
1. Apps Script 편집기에 붙여넣기 → 저장
2. **배포 → 배포 관리 → 편집(연필 아이콘)**
3. **버전 → 새 버전**
4. **배포** — URL은 유지되며 내용만 새 버전으로 교체됨

## 참고

- 캘린더 링크는 코드 상수(`CALENDAR_LINK`)에 하드코딩되어 있음. 바꾸려면 `decision-mailer.gs` 상단 수정 후 위 재배포 절차.
- 발신자 이름은 `GmailApp.sendEmail(...)` 옵션의 `name: '하임벤처투자'` 로 표시됨. 회신 주소는 `hello@heimvi.com`.
- Gmail 발송 일일 한도: 개인 Google 계정 500건/일, Workspace 2000건/일. 접수 규모 상 문제 없음.
