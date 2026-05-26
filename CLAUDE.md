# HEIM ERP — 하임벤처투자 운영 시스템

다음 세션에서 이 프로젝트를 이어가기 위한 컨텍스트 문서.

## 프로젝트 한 줄 소개

하임벤처투자(스타트업 컨설팅)의 전체 워크플로우를 관리하는 ERP. **클라이언트 스타트업을 TIPS 프로그램에 선정시키는 컨설팅 파이프라인이 핵심.**

## 사용자 3종 역할

- **관리자 (하임)** — 모든 데이터 RW, 커스텀 필드(컬럼) 추가 가능
- **HVP (Heim Venture Partners, 영업자)** — 자기 데려온 기업만 RW. 단계는 접수→1차미팅까지만 변경. 본인 수수료(계약비의 20%) 조회
- **기업 (스타트업)** — 자기 회사 조회 + 자료 업로드 + To-do 완료 체크만

## 비용 정책 ⚠️

**0원 운영이 절대 조건.** Supabase Free + Netlify Free + Cloudflare R2 무료 + Gemini Flash 무료티어만 사용. 유료 옵션 제안 금지.

## 기술 스택

| 영역 | 선택 | 상태 |
|---|---|---|
| 프레임워크 | Next.js 16 App Router + TypeScript + Turbopack | ✅ |
| 스타일링 | Tailwind 4 + shadcn/ui (14개 컴포넌트) | ✅ |
| 폰트 | Pretendard (CDN) | ✅ |
| DB + Auth | Supabase Free | ⏳ |
| 대용량 파일 | Cloudflare R2 (10GB 무료) | ⏳ |
| AI 회의록 요약 | Google Gemini 2.0 Flash (일 1,500회 무료) | ⏳ |
| 이메일 알림 | Resend Free (3,000건/월) | ⏳ |
| 호스팅 | Netlify Free | ⏳ |

## 폴더 / 환경

- **작업 폴더**: `C:\Users\laa02\Projects\heim-erp`
- **mockup 참고**: `C:\Users\laa02\OneDrive\Desktop\Heimvc\heim-erp-mockup` (정적 HTML 6개)
- VS Code, Node v25.8.2 (Miniconda base), Git 2.54.0
- Bash 명령 패턴: `cmd //c "call C:\Users\laa02\miniconda3\Scripts\activate.bat && cd /d C:\Users\laa02\Projects\heim-erp && <명령>"`
- Dev server: `npm run dev` → http://localhost:3000

## 단계(stage) 디자인

**영업 칸반 5단계**: `접수 → 1차미팅 → 제안 → 계약 → 착수`

**컨설팅 타임라인 7단계** (착수 후): `착수 → 초기검토 → 개발자문/1차사업계획 → IR Deck → TIPS 운영사 IR → TIPS 심사 → 조합투자 Closing → Final Closing`

(언제든) `Drop`

**프로그램 등급**: `Premium / Basic / Free` (컨설팅 제안금액 1,500만/1,000만원, HVP 수수료 20%)

## 단계 진입 시 자동 To-do 룰 (v1: 코드 하드코딩)

| 단계 진입 | 자동 To-do | 담당자 | 알림 |
|---|---|---|---|
| 접수 (Tally 직후) | "OO기수 카톡방 초대" / "신규 접수 검토" / "1차 미팅 일정" | HVP / 관리자 / 컨설턴트 | 메일 |
| 1차미팅 | "회의록 작성" / "내부 검토" | 컨설턴트 / 관리자 | - |
| 제안 | "제안서·견적서 작성" | 컨설턴트 | - |
| 계약 | "계약서 작성" / "조건 확정" | 컨설턴트 | HVP 알림 |
| 착수 | "킥오프 일정" / "HVP 수수료 정산 등록" / "초기 검토" | 컨설턴트 / 관리자 | HVP 알림 |
| IR Deck | "초안" / "내부 리뷰" | 컨설턴트 | - |
| TIPS 운영사 IR | "운영사 매칭" / "IR 일정" | 관리자 | - |
| TIPS 심사 | "심사 결과 추적" | 관리자 | - |
| Final Closing | "HVP 수수료 지급" / "모니터링 시작" | 관리자 | HVP 알림 |
| Drop | "Drop 사유 기록" | 컨설턴트 | HVP 알림 |

## 외부 데이터 소스

- **Tally 폼 1** (기업 접수, HVP가 사용): https://tally.so/r/1AMgOQ
- **Tally 폼 2** (HVP 마스터코스 신청): https://tally.so/r/q4YRxG
- **노션 마스터 대시보드**: https://www.notion.so/HEIM-Dash-Board-2491fd615b8080ccb622d36536ddd9b7

## ERD 핵심 테이블

`profiles` (auth.users 확장, role) · `hvp` · `hvp_applications` · `companies` · `company_stage_history` · `meetings` · `todos` · `files` · `contracts` · `notifications` · `activity_log` · `custom_fields` (jsonb, v1은 HVP만)

## 만든 페이지 (현재)

- ✅ `/` — 로그인 (역할 빠른 전환)
- ✅ `/admin/dashboard` — 관리자 대시보드
- ✅ `/hvp/dashboard` — HVP 대시보드
- ✅ Layout & Sidebar 컴포넌트

## 남은 작업 (우선순위)

1. `/admin/pipeline` — 영업 칸반 (드래그&드롭 v1.5)
2. `/admin/companies/[id]` — 기업 상세 (탭 + 컨설팅 타임라인 + AI 회의록 요약)
3. `/admin/hvp` — HVP 관리 + 신규 추가 + **커스텀 필드 추가** UI
4. `/company/dashboard` — 기업용 화면
5. Supabase 프로젝트 생성·스키마·RLS
6. 인증 미들웨어 + 역할 가드
7. Tally Webhook + CSV 업로드
8. 단계별 자동 To-do/알림 룰
9. 노션 데이터 마이그레이션
10. Netlify 배포

## 다음 세션 빠른 시작

```bash
cd C:\Users\laa02\Projects\heim-erp
npm run dev
```

브라우저: http://localhost:3000

## 디자인 참고

- mockup 폴더의 6개 HTML 톤 유지: zinc, 흰 배경, 둥근 모서리, 미니멀 그림자
- 강조 색: emerald/blue/amber/purple
- 폰트: Pretendard 통일

## 주의

사이드바의 미구현 메뉴(`/admin/applications`, `/admin/contracts`, 등)는 404. 우선순위 1~4 페이지 작업하면서 placeholder도 같이 만들 것.
