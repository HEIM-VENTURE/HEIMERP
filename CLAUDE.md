# HEIM ERP — 하임벤처투자 운영 시스템

다음 세션에서 이 프로젝트를 이어가기 위한 컨텍스트 문서.

## 프로젝트 한 줄 소개

하임벤처투자(스타트업 컨설팅)의 전체 워크플로우 ERP. **클라이언트 스타트업을 TIPS 프로그램에 선정시키는 컨설팅 파이프라인이 핵심.**

## 운영 URL

- **Production**: https://heimventure.netlify.app
- **GitHub**: https://github.com/imyoonaheo/Heim-venture
- **Supabase Project ID**: `evcdteayjtflrujabvys`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/evcdteayjtflrujabvys

## 사용자 3종 역할

| 역할 | 권한 | 자동 매칭 |
|---|---|---|
| **admin** | 전체 RW | `@heimvi.com` 도메인 → 자동 admin |
| **hvp** | 자기 데려온 기업만 RW | hvp 테이블의 이메일 매칭 시 자동 |
| **company_member** | 자기 회사만 R, 일부 W | 기본값 |

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

## 외부 데이터 소스

- **Tally 기업 접수 폼**: https://tally.so/r/1AMgOQ → Webhook 연동됨
- **구글 폼 HVP 신청**: https://docs.google.com/forms/d/e/1FAIpQLSdMnfm4GLLm3MLqg1DEVrCdinai2kL1pP7rcZVDhjHT4GVjhw/viewform → Google Apps Script로 webhook 연동됨

## 완성된 페이지

### Admin (`@heimvi.com`)
- ✅ `/admin/dashboard` — KPI + 단계별 분포 + 월별 차트 + 최근 활동 + 오늘 할일
- ✅ `/admin/pipeline` — 테이블 + 4종 필터 + KPI/차트
- ✅ `/admin/applications` — HVP 신청자 관리 + 승인+계정생성
- ✅ `/admin/todos` — To-do 관리 (수동 추가 모달 + 체크박스 완료)
- ✅ `/admin/companies/[id]` — 12단계 통합 타임라인 + 활동 피드 + 단계 변경 + 미팅·회의록 추가 + AI 요약

### HVP
- ✅ `/hvp/dashboard` — KPI + 깔때기 + 내 기업 요약
- ✅ `/hvp/companies` — 내 기업 목록 + 검색 + 단계 필터
- ✅ `/hvp/submit` — 새 기업 접수 폼 (ERP 자체)
- ✅ `/hvp/companies/[id]` — 12단계 + 미팅 + To-do + 내 수수료

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
| 1 | `/admin/contracts` (계약·수수료) | 단계 "계약" 진입 시 자동 contracts 생성 + 지급 처리 UI |
| 2 | `/hvp/fees` | HVP가 자기 수수료 자세히 |
| 3 | 자료 업로드 (Supabase Storage) | 사업계획서·IR Deck 등 첨부 |
| 4 | 이메일 알림 (Resend) | "오늘 마감 To-do" 알림 |
| 5 | 기업 정보 직접 편집 UI | 현재는 SQL로만 |
| 6 | HVP가 자기 기업 미팅·자료 추가 | RLS는 OK, UI만 admin에 있음 |
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
