# HEIM ERP — 하임벤처투자 운영 시스템

다음 세션에서 이 프로젝트를 이어가기 위한 컨텍스트 문서.

---

## ⚡ 다음 세션 먼저 읽기 (2026-08-05 인수인계 — 데모데이·재디자인·자간 sweep 완료)

**상태: Vercel 배포 활성 (main auto-deploy). 최신 커밋 `e41db52`.**

### ✅ 이전 세션에서 완료된 사용자 셋업

- ✅ Supabase 마이그레이션 `0030_demoday.sql` 실행 완료
- ✅ 환경변수 `DEMODAY_TOKEN_SECRET` 로컬 + Vercel Production/Preview 등록 완료
- ✅ 데모데이 시스템 사용 준비 완료 (아직 첫 회차 만들기 전)

### 🐛 최근 픽스

- `7a45169` — 대시보드 500 에러 해결 (준비 중 도메인 카드의 onClick 을 Server Component 규칙에 맞게 Wrapper 로 분기)

### ⏭️ 다음 세션 첫 확인

1. https://heim-erp.vercel.app/admin/dashboard 정상 로드 확인 (재배포 완료 후)
2. `/admin/demoday/new` 로 첫 실제 데모데이 회차 만들어보기 (사용자 다음주 실사용 목표)
3. 심사역 초청 → 토큰 URL 발급 → 실제 심사역에게 전달 흐름 검증

### 📦 이번 세션(들)에서 완성된 것

**대규모 재구조화:**
- HVP 프로그램 전면 삭제 (라우트·컴포넌트·DB 마이그레이션 0029)
- 대시보드 5도메인 포털 + 사이드바 그룹화 재구성
- 기업 상세 화면 헤로 헤더 재디자인 (헤더 카드 + quick stats)
- 자간(letter-spacing) 넓힘 전체 제거 (16개 파일, 27건)

**새 도메인 UI 껍데기 (mock 데이터):**
- `/admin/applications` — 접수 검토 (mock, 5건)
- `/admin/projects` — 프로젝트 (mock, 6건)
- `/admin/deals` — 투자 딜 (mock, 3건)

**공개 랜딩 페이지:**
- `/apply` — 기업 접수 신청서 (여의도 사진 배경 + Pretendard + 15필드 + 3파일)

**데모데이 시스템 (실 DB · Supabase 기반) — 스펙 §2 완전 준수:**
- `lib/demoday/*` — Repository 패턴, HMAC 세션 쿠키, 서버 검증
- API 라우트 10개 (공개 3 + 관리자 7)
- `/demoday/j/[token]/*` — 심사역 랜딩 (모바일 우선, 자동 임시저장, 4축 점수, verdict 5-option)
- `/admin/demoday/*` — 관리자 콘솔 (회차 CRUD, 심사역 초청, 중복 감지, 토큰 발급, 실시간 요약, **회차 삭제**)

**실 데이터 정리:**
- 결제 고객 리스트 (49건) → Supabase companies 반영 (24 UPDATE + 22 INSERT)

### 🔗 주요 URL (배포 완료 후)

| 목적 | URL |
|---|---|
| 홈 대시보드 | https://heim-erp.vercel.app/admin/dashboard |
| 기업 접수 신청 (외부 공개) | https://heim-erp.vercel.app/apply |
| 데모데이 관리 | https://heim-erp.vercel.app/admin/demoday |
| 새 데모데이 생성 | https://heim-erp.vercel.app/admin/demoday/new |
| 심사역 랜딩 (토큰 발급 후) | https://heim-erp.vercel.app/demoday/j/{token} |

### ⏭️ 다음 우선순위

1. **사용자가 마이그레이션·env 완료** (필수 · 위 참고)
2. **데모데이 첫 실사용 테스트** — 새 회차 만들고 심사역 초청 → 토큰 URL로 실 제출 흐름 검증
3. 남은 도메인 실데이터 전환 (applications, projects, deals — 현재 mock)
4. 사후 모니터링 도메인 신규 구축
5. `/apply` 백엔드 완성 (Phase 1b/1c — 실 데이터 저장, 이메일)

### 🔑 기타 유지
- admin@heimvi.com Google 로그인 · `@heimvi.com`·`@heiminworld.com` 자동 admin
- Pretendard heimventure.com 스택 통일
- 자간 넓힘 금지 (사용자 규칙) — 새로 CSS 쓸 때 `tracking-wide/wider/widest/tracking-[0.XXem]` 사용 X
- 여의도 사진(D) 랜딩 페이지에 사용 중 (`public/apply-hero.jpg`)

### 🚨 HVP 프로그램 종료 결정 (2026-08-03)

사업 방향 변경으로 **HVP(Heim Venture Partners) 프로그램 중단**. 이번 세션에서 코드 스택 전체 정리:

**삭제된 라우트/파일:**
- `app/hvp/**` 전체 (dashboard·companies·fees·notifications·submit)
- `app/admin/hvp/**` 전체
- `app/admin/applications/**` — HVP 신청자 온보딩 페이지 통째로
- `app/api/webhooks/{tally,google-form}/hvp-applications/` 웹훅 2개
- `components/sidebar/hvp-{sidebar,shell}.tsx`

**참조 정리된 파일 (30개 내외):**
- `lib/supabase/middleware.ts`: `/hvp` 보호경로 제거
- `app/auth/**`, `app/page.tsx`, `app/company/layout.tsx`: `role === 'hvp'` 분기 제거
- `lib/labels.ts`: `HVP_*_LABELS`, `hvpStageHint`, `HVP_FIELD_LABELS` 삭제, `ROLE_LABELS`에서 hvp 제거
- `components/sidebar/admin-sidebar.tsx`: HVP·신청자 접수 nav 제거
- `app/admin/dashboard/page.tsx`: "활동 HVP" KPI → "계약 금액 누계"로 대체, HVP 로스터 없음, hvp_fee_amount 누계 제거
- `app/admin/contracts/**`: HVP 수수료 필드·필터·컬럼 다 걷어냄. `payment_status`는 DB 컬럼만 남기고 UI 숨김 (나중에 클라이언트 지급 추적용으로 재활용 가능)
- `app/admin/pipeline/**`, `todos/**`, `companies/[id]/**`, `settings/actions.ts`, `meeting-actions.ts`, `file-actions.ts`, `new-meeting-modal.tsx`: 담당 HVP 필드·hvp_id 컬럼 다 제거

**신규 마이그레이션: `0029_drop_hvp.sql`**
- `profiles.role='hvp'` → `'company_member'` 강등
- `auto_create_contract()` 함수 재정의 (hvp_id/hvp_fee_rate 참조 제거)
- FK 컬럼 DROP: `companies.hvp_id`, `contracts.hvp_id/hvp_fee_rate/hvp_fee_amount`, `profiles.hvp_id`
- 테이블 DROP CASCADE: `hvp`, `hvp_applications`, `hvp_field_definitions`
- Enum DROP: `hvp_status`, `hvp_application_status`
- `app_role` enum 재생성 → `('admin', 'company_member')` (hvp 제거)
- ⚠️ **아직 Supabase에 적용 안 됨.** 사용자가 SQL Editor에서 실행 필요. **되돌릴 수 없음** (22 HVP 시드/신청 이력 소멸).

**로컬 빌드 통과 확인:** `npm run build` 성공, TypeScript 타입체크 통과.

### 📌 새로 도입 예정: 관리자 세부 역할 (심사역 계층)

이번 세션에서는 코드에 미반영. **다음 세션에서 작업할 것.**

- 관리자 단일 role → **랭크별 뷰 스코프 분리** (사용자 요청)
- 실제 인원: 박대성(대표), 강영환(수석심사역), 허유나(선임심사역), 기동현(심사역)
- RLS로 데이터 스코프 강제: 심사역=본인 담당만, 수석=본인+하위, 대표=전체
- 동일 대시보드 쉘에서 랭크에 따라 자동 스코프 (별도 화면 3개가 아님)
- ⚠️ 아직 미확정 결정: 수석이 하위 감독하는지·대표가 담당 포트폴리오 있는지·크로스체크 허용 여부 — 사용자 확답 대기

### 🎨 UI 디자인 방향 확정 (Linear 스타일 다크 우선)

- 사용자 승인. 목업: `C:\Users\laa02\AppData\Local\Temp\claude\...\heim-erp-linear-mockup.html` (Artifact로 배포됨)
- 팔레트: bg `#0B0D10` (쿨 바이어스), accent `#F26B3A` (하임 오렌지), steel `#7A9AC0`, 세만틱 color 별도
- 13px 본문, 얇은 1px 보더, 10px radius, tabular-nums
- 실제 코드 적용은 아직 미시작 (다음 세션 후반부)

### ❗ 배포 정책 (동일)
- Netlify 무료 크레딧 75% 소진 → push 안 하는 중. 로컬 검증만.
- 사용자가 "배포하자" 하면 `git push origin main` 1번.
- 최종 Vercel 이전 예정 (icn1 서울 리전).

### ⏭️ 다음 할 일 (우선순위)

1. **사용자가 Supabase SQL Editor에서 `0029_drop_hvp.sql` 실행** — 실행 후 확인 필요
2. **관리자 세부 역할(심사역 계층) 스키마 설계 + 마이그레이션** — 3개 확답 받고 시작
3. Linear 스타일 디자인 실제 코드 적용 (globals.css 팔레트 재작성, 컴포넌트 단위로)
4. 비어있는 메뉴 `/admin/meetings`, `/admin/tips` 정리 또는 채우기
5. 배포 → Vercel 이전

### 🔑 기타 메모
- admin@heimvi.com = **Google 계정** (Google 전용 로그인)
- Google 로그인 운영 Redirect URL 설정 확인 필요
- HEIM ADS OS(다른 목업) Firestore: projectId `heim-ads`, HVP 데이터 출처였음 (이제 무의미)

---

## 프로젝트 한 줄 소개

하임벤처투자(스타트업 컨설팅)의 전체 워크플로우 ERP. **클라이언트 스타트업을 TIPS 프로그램에 선정시키는 컨설팅 파이프라인이 핵심.**

## 운영 URL

- **Production**: https://heimventure.netlify.app
- **GitHub**: https://github.com/imyoonaheo/Heim-venture
- **Supabase Project ID**: `evcdteayjtflrujabvys`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/evcdteayjtflrujabvys

## 사용자 2종 역할 (2026-08-03 이후)

| 역할 | 권한 | 자동 매칭 |
|---|---|---|
| **admin** | 전체 RW | `@heimvi.com` / `@heiminworld.com` 도메인 → 자동 admin |
| **company_member** | 자기 회사만 R, 일부 W | 기본값 |

> HVP 역할은 2026-08-03 삭제됨. 관리자 세부 역할(심사역 계층)은 다음 세션에서 도입 예정.

## 비용 정책 ⚠️

**0원 운영이 절대 조건.** 모두 무료 티어. 유료 옵션 제안 금지.

## 기술 스택 (전부 작동 중)

| 영역 | 선택 | 상태 |
|---|---|---|
| Frontend | Next.js 16 App Router + TS + Tailwind 4 + Turbopack | ✅ |
| UI | shadcn/ui + Pretendard | ✅ |
| DB + Auth + Storage | Supabase Free | ✅ |
| AI 요약 | Google Gemini 2.0 Flash (무료) | ✅ |
| 호스팅 | Netlify Free | ✅ |
| Google OAuth | Google Cloud Console (무료) | ✅ |
| Tally Webhook | Tally Pro | ✅ |
| Google Form Webhook | Apps Script | ✅ |
| Cloudflare R2 | (미연동, v1.5) | ⏳ |
| Resend (이메일) | (미연동, v1.5) | ⏳ |

## 폴더 / 환경

- **작업 폴더**: `C:\Users\laa02\Projects\heim-erp`
- **mockup 참고**: `C:\Users\laa02\OneDrive\Desktop\Heimvc\heim-erp-mockup`
- Node v25.8.2 (Miniconda base), Git 2.54.0, VS Code

**Bash 명령 패턴**:
```bash
cmd //c "call C:\Users\laa02\miniconda3\Scripts\activate.bat && cd /d C:\Users\laa02\Projects\heim-erp && <명령>"
```

**Dev server**: 사용자가 직접 Miniconda Prompt에서 `npm run dev` → http://localhost:3000

## 환경변수 (`.env.local` + Netlify)

| Key | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | https://evcdteayjtflrujabvys.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon key (eyJhbGc...) |
| `SUPABASE_SERVICE_ROLE_KEY` | 관리자 API용 (webhook, 신청 승인 등) |
| `TALLY_WEBHOOK_SECRET` | Tally/Google Form webhook 시크릿 |
| `GOOGLE_GENAI_API_KEY` | Gemini AI 요약용 |

## 단계 디자인

**영업 5단계**: `received → meeting_1st → proposal → contract → kickoff`

**컨설팅 7단계** (착수 후): `kickoff → initial_review → dev_advisory → ir_deck → tips_operator_ir → tips_review → fund_closing → final_closing`

**프로그램 등급**: `premium / basic / free`

## SQL 마이그레이션 (0001~0012)

모두 `supabase/migrations/` 에 있음. 새 환경에 적용하려면 순서대로 실행.

| 번호 | 내용 |
|---|---|
| 0001 | 초기 스키마 (13 테이블 + enum + 트리거) |
| 0002 | RLS 정책 |
| 0003 | 시드 데이터 (테스트용, 옵션) |
| 0004 | handle_new_user 트리거 권한 픽스 |
| 0005 | anon/authenticated GRANT |
| 0006 | 노션 투자&TIPS 컨설팅 51개 import |
| 0007 | 단계 변경 시 자동 To-do 트리거 |
| 0008 | HVP 5명 시드 + 회사 담당 할당 |
| 0009 | hvp_applications에 cohort 컬럼 |
| 0010 | service_role GRANT |
| 0011 | handle_new_user에 hvp 자동 매칭 |
| 0012 | @heimvi.com 자동 admin |
| 0013 | 'contract' 단계 진입 시 contracts row 자동 생성 |
| 0014 | Storage 버킷 `company-files` (자료 업로드, 50MB, private) |
| 0015 | meetings.ai_todos JSONB (AI 추출 To-do 후보 저장) |

## 외부 데이터 소스

- **Tally 기업 접수 폼**: https://tally.so/r/1AMgOQ → Webhook 연동됨
- **구글 폼 HVP 신청**: https://docs.google.com/forms/d/e/1FAIpQLSdMnfm4GLLm3MLqg1DEVrCdinai2kL1pP7rcZVDhjHT4GVjhw/viewform → Google Apps Script로 webhook 연동됨

## 완성된 페이지

### Admin (`@heimvi.com`)
- ✅ `/admin/dashboard` — KPI + 단계별 분포 + 월별 차트 + 최근 활동 + 오늘 할일
- ✅ `/admin/pipeline` — 테이블 + 4종 필터 + KPI/차트
- ✅ `/admin/applications` — HVP 신청자 관리 + 승인+계정생성
- ✅ `/admin/todos` — To-do 관리 (수동 추가 모달 + 체크박스 완료)
- ✅ `/admin/companies/[id]` — 12단계 통합 타임라인 + 활동 피드 + 단계 변경 + 미팅·회의록 추가 + AI 요약 + 계약·수수료 카드 + **기업 정보 편집 모달** + **자료 업로드(Storage)**
- ✅ `/admin/contracts` — 계약·수수료 목록 + KPI(총액·지급/미지급) + 지급상태/HVP 필터 + 생성/편집/지급 토글
- ✅ `/admin/pipeline`, `/admin/dashboard` — **+신규 기업 추가 모달** 연결 (이전엔 작동 안 함)

### HVP
- ✅ `/hvp/dashboard` — KPI + 깔때기 + 내 기업 요약
- ✅ `/hvp/companies` — 내 기업 목록 + 검색 + 단계 필터
- ✅ `/hvp/submit` — 새 기업 접수 폼 (ERP 자체)
- ✅ `/hvp/companies/[id]` — 12단계 + 미팅 + To-do + 내 수수료 + **자료 업로드**
- ✅ `/hvp/fees` — 내 계약별 수수료 표 + 지급/미지급 합계

### 공용
- ✅ `/` — 로그인 (Google + 이메일/비밀번호)
- ✅ `/auth/callback` — OAuth 콜백
- ✅ `/company/dashboard` — placeholder

## 자동화 흐름

```
[HVP 모집]
구글 폼 신청 → Apps Script → webhook → hvp_applications "신규"
  → /admin/applications에서 admin이 "승인+계정생성" 클릭
  → hvp 테이블 INSERT
  → HVP에게 "본인 Google 계정으로 로그인" 안내
  → HVP가 Google 로그인 → 이메일 매칭 자동 → role='hvp' + hvp_id 자동 연결

[영업]
HVP가 Tally 폼 또는 /hvp/submit에서 기업 접수 → companies INSERT
  → 자동 To-do 트리거 (예: "기수 카톡방 초대")
  → admin이 단계 변경 → 또 자동 To-do
  → 단계 진입 시 자동으로 contracted_at, started_at 채워짐
```

## 자동 To-do 룰 (0007 트리거)

| 단계 진입 | 자동 To-do |
|---|---|
| received | 기수 카톡방 초대, 신규 검토, 1차 미팅 일정 |
| meeting_1st | 회의록 작성, 내부 검토 회의 |
| proposal | 제안서 작성·발송, 견적서 작성 |
| contract | 계약서 작성, 계약 조건 확정 |
| kickoff | 킥오프 미팅 일정, HVP 수수료 정산, 초기 검토 |
| ir_deck | IR Deck 초안, 내부 리뷰 |
| tips_operator_ir | TIPS 운영사 매칭, IR 일정 |
| tips_review | 심사 결과 추적 |
| final_closing | HVP 수수료 지급, 기업 모니터링 시작 |

## 핵심 헬퍼

- `lib/labels.ts` — UI 라벨·색상 매핑 (영어 DB ↔ 한국어 UI)
- `lib/supabase/client.ts` — 브라우저용 (createBrowserClient)
- `lib/supabase/server.ts` — 서버용 (createServerClient + cookies)
- `lib/supabase/admin.ts` — service_role (RLS 우회, webhook·승인 액션용)
- `lib/supabase/middleware.ts` — 세션 쿠키 갱신 + 권한 가드
- `lib/tally.ts` — Tally 페이로드 파싱
- `lib/gemini.ts` — Gemini AI 요약

## 남은 작업 (우선순위순)

| 순위 | 작업 | 비고 |
|---|---|---|
| ~~1~~ | ~~`/admin/contracts` (계약·수수료)~~ | ✅ 완료 (0013 마이그레이션 + 페이지) |
| ~~2~~ | ~~`/hvp/fees`~~ | ✅ 완료 |
| ~~3~~ | ~~자료 업로드 (Supabase Storage)~~ | ✅ 완료 (0014 버킷 + admin/HVP 기업상세) |
| 4 | 이메일 알림 (Resend) | "오늘 마감 To-do" 알림 |
| ~~5~~ | ~~기업 정보 직접 편집 UI~~ | ✅ 완료 (편집 모달 + +신규 추가 모달) |
| ~~6~~ | ~~HVP가 자기 기업 자료 추가~~ | ✅ 자료는 완료 (미팅 추가 UI는 남음) |
| 7 | `/admin/meetings` (회의록 전체) | 모든 회사 미팅 한 화면 |
| 8 | `/admin/tips` (TIPS 운영사 DB) | tips_operators 테이블 활용 |
| 9 | `/hvp/notifications`, `/hvp/profile` | placeholder 페이지들 |
| 10 | 알림 시스템 (notifications 테이블) | UI + 실시간 |
| 11 | 모바일 반응형 | 현재 데스크탑 위주 |
| 12 | 회의록 녹음 + STT (v1.5) | 무료 STT 한계 — 유료 검토 |

## 알려진 이슈

- Next.js 16: `middleware.ts` deprecated 경고 → `proxy.ts`로 이름 변경 필요 (작동엔 X 영향)
- 시드 HVP 5명 (김민준 등)은 가짜 이메일 — 실제 운영 시 교체
- `yoona.heo04@gmail.com`은 테스트용 HVP — 실제 운영 시 정리

## 다음 세션 빠른 시작

```bash
cd C:\Users\laa02\Projects\heim-erp
npm run dev
```

또는 그냥 Production URL: https://heimventure.netlify.app

새 세션에서 Claude에게: **"이어서 작업하자"** 또는 **"#1번부터 시작하자"** 정도면 OK.

## 디자인 톤

- Pretendard 폰트
- zinc 베이스 + 강조 색 (emerald/blue/amber/purple/rose)
- 흰 배경 + 둥근 모서리 + 미니멀 그림자
- 가독성·정보 밀도 우선 (노션 차별화)
