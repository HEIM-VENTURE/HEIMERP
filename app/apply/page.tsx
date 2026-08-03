import Image from "next/image";
import { submitApplicationAction } from "./actions";

export const metadata = {
  title: "기업성장 프로젝트 신청 · HEIM Venture Investment",
  description:
    "하임벤처투자와 함께 TIPS 선정·투자 유치·성장 전략을 만들어갈 기업을 찾습니다.",
};

const GROWTH_STAGES = [
  { value: "idea", label: "사업 아이디어와 고객 문제를 구체화하는 단계" },
  { value: "mvp", label: "MVP 또는 시제품을 개발하는 단계" },
  { value: "poc", label: "고객 테스트, PoC 또는 실증을 진행하는 단계" },
  { value: "early_revenue", label: "초기 유료 고객을 확보하고 매출이 발생한 단계" },
  { value: "recurring", label: "재구매 또는 반복매출을 만들어가는 단계" },
  { value: "scaling", label: "본격적으로 매출과 조직을 확장하는 단계" },
  { value: "pre_ipo", label: "대규모 투자, 해외진출 또는 IPO를 준비하는 단계" },
];

const REVENUE_RANGES = [
  { value: "none", label: "아직 매출이 없음" },
  { value: "under_1", label: "1억원 미만" },
  { value: "1_to_5", label: "1억 ~ 5억원" },
  { value: "5_to_10", label: "5억 ~ 10억원" },
  { value: "10_to_30", label: "10억 ~ 30억원" },
  { value: "30_to_100", label: "30억 ~ 100억원" },
  { value: "over_100", label: "100억원 이상" },
  { value: "unknown", label: "정확한 확인이 필요함" },
];

const GROWTH_TRENDS = [
  { value: "declining", label: "감소하고 있음" },
  { value: "flat", label: "큰 변화 없이 정체되어 있음" },
  { value: "slow_growth", label: "조금씩 성장하고 있음" },
  { value: "fast_growth", label: "빠르게 성장하고 있음" },
  { value: "too_early", label: "최근 실적이 없어 비교하기 어려움" },
  { value: "not_tracked", label: "관련 지표를 아직 관리하지 않고 있음" },
];

const PRIORITIES = [
  { value: "market_customer", label: "시장 및 핵심 고객 설정" },
  { value: "product_tech", label: "제품 및 기술 고도화" },
  { value: "revenue_model", label: "수익 모델 및 수익성" },
  { value: "marketing_sales", label: "마케팅 및 영업 확대" },
  { value: "retention", label: "고객 유지 및 반복 매출" },
  { value: "finance_ops", label: "재무 관리 및 운영 자금" },
  { value: "hr_org", label: "핵심 인력 및 조직 운영" },
  { value: "strategy", label: "사업 전략 및 우선순위" },
  { value: "fundraising", label: "투자 유치 및 자금조달" },
  { value: "regulation", label: "규제 및 인허가" },
  { value: "other", label: "기타" },
];

const CHANNELS = [
  { value: "search", label: "인터넷 검색" },
  { value: "referral", label: "지인 소개" },
  { value: "event", label: "행사·설명회" },
  { value: "sns", label: "SNS·뉴스레터" },
  { value: "other", label: "기타" },
];

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ApplyPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "#FFFFFF", color: "#1F2A36" }}
    >
      <div className="min-h-screen grid sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ═══════════════════════════════════════════════
            LEFT PANE — Brand / Trust
           ═══════════════════════════════════════════════ */}
        <aside className="relative text-white">
          {/* aside 자체는 grid 로 인해 전체 세로 길이 채움
              내부 sticky 컨테이너는 뷰포트 높이 = 스크롤해도 계속 보임 */}
          <div
            className="sm:sticky sm:top-0 relative overflow-hidden sm:h-screen min-h-[600px]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(20,30,45,0.55) 0%, rgba(20,30,45,0.35) 40%, rgba(20,30,45,0.85) 100%), url('/apply-hero.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* 콘텐츠 */}
            <div className="relative flex flex-col justify-between h-full px-10 lg:px-14 py-10 lg:py-14">
              {/* Logo (white version for dark background) */}
              <div>
                <Image
                  src="/heim-logo-mark-white.png"
                  alt="HEIM VENTURE INVESTMENT"
                  width={460}
                  height={140}
                  priority
                  className="w-[240px] lg:w-[280px] h-auto"
                />
              </div>

              {/* Hero — 중간 */}
              <div>
                <h1 className="text-[44px] lg:text-[56px] leading-[1.15] tracking-[-0.03em] font-semibold text-white text-balance drop-shadow-lg">
                  다음 라운드까지,
                  <br />
                  <span className="font-normal" style={{ color: "#FFB59E" }}>
                    실행 파트너로
                    <br className="hidden lg:block" />
                    함께합니다.
                  </span>
                </h1>
                <p className="mt-7 text-[18px] leading-[1.65] text-white/90 max-w-md drop-shadow font-medium">
                  하임벤처투자는 TIPS 선정 · 투자 유치 · 성장 전략까지
                  실행 단계까지 책임지는 파트너입니다.
                </p>
              </div>

              {/* 하단 */}
              <div>
                <a
                  href="https://heimventure.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 text-[15px] text-white/90 hover:text-white transition-all mb-7"
                >
                  <span className="uppercase text-[12px] text-white/60">Company</span>
                  <span className="text-white/30">·</span>
                  <span className="underline underline-offset-4 decoration-white/30 group-hover:decoration-white font-medium">
                    heimventure.com
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 opacity-70">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
                <div className="pt-6 border-t border-white/15 text-[13px] text-white/60 leading-relaxed">
                  <div className="font-medium text-white/75">HEIM VENTURE INVESTMENT · 하임벤처투자(주)</div>
                  <div className="mt-1.5">
                    문의:{" "}
                    <a
                      href="mailto:admin@heimvi.com"
                      className="text-white/80 hover:text-white transition-colors underline underline-offset-2"
                    >
                      admin@heimvi.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════
            RIGHT PANE — Form
           ═══════════════════════════════════════════════ */}
        <main className="relative" style={{ background: "#FFFFFF" }}>
          <div className="mx-auto max-w-2xl px-8 lg:px-14 py-14 lg:py-20">
            <div
              className="text-[12px] font-medium mb-5"
              style={{ color: "#C74815" }}
            >
              신청서 · 약 5분 소요
            </div>
            <h2
              className="text-[38px] leading-[1.2] tracking-[-0.025em] font-semibold mb-5 text-balance"
              style={{ color: "#1F2A36" }}
            >
              기업 접수 신청서
            </h2>
            <p className="text-[16.5px] leading-relaxed mb-12" style={{ color: "#5D6B7A" }}>
              접수 후 <b style={{ color: "#1F2A36" }}>5영업일 이내</b>에 이메일로 회신드립니다.
              정확한 수치를 모르시는 경우 가장 가까운 항목을 선택해주세요.
            </p>

            {error ? (
              <div
                className="mb-6 px-4 py-3 rounded-lg text-[13px]"
                style={{
                  backgroundColor: "#FBEAE5",
                  color: "#A83A20",
                  border: "1px solid #F2CBBF",
                }}
              >
                {error}
              </div>
            ) : null}

            <form action={submitApplicationAction} className="space-y-12">
              {/* ── 01 기업 정보 ── */}
              <Section index="01" title="기업 정보">
                <Grid>
                  <Field label="기업명" required>
                    <Input name="company_name" required placeholder="예: 하임벤처투자" />
                  </Field>
                  <Field label="사업자등록번호" hint="선택 · 등록 전이면 비워두세요">
                    <Input
                      name="business_number"
                      placeholder="000-00-00000"
                      pattern="[0-9\-]{10,12}"
                    />
                  </Field>
                  <Field label="대표자명" required>
                    <Input name="ceo_name" required placeholder="예: 홍길동" />
                  </Field>
                  <Field label="상근 인원" required>
                    <Input
                      name="headcount"
                      type="number"
                      min={1}
                      required
                      placeholder="예: 5"
                    />
                  </Field>
                </Grid>
                <Field label="홈페이지 또는 제품·서비스 링크">
                  <Input name="website" type="url" placeholder="https://..." />
                </Field>
                <Field label="한 줄 사업 소개" required hint="200자 이내">
                  <Textarea
                    name="tagline"
                    required
                    rows={2}
                    maxLength={200}
                    placeholder="어떤 문제를 어떤 방식으로 푸는지 한 문장으로 알려주세요."
                  />
                </Field>
              </Section>

              {/* ── 02 담당자 정보 ── */}
              <Section index="02" title="담당자 정보">
                <Grid>
                  <Field label="담당자명" required>
                    <Input name="contact_name" required placeholder="예: 김담당" />
                  </Field>
                  <Field label="직책 · 부서">
                    <Input name="contact_role" placeholder="예: CEO / 사업개발" />
                  </Field>
                  <Field label="이메일" required>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                    />
                  </Field>
                  <Field label="연락처" required>
                    <Input name="phone" type="tel" required placeholder="010-0000-0000" />
                  </Field>
                </Grid>
              </Section>

              {/* ── 03 진단 정보 ── */}
              <Section index="03" title="현재 상황 · 진단">
                <Field label="현재 성장 단계" required>
                  <Select name="growth_stage" required options={GROWTH_STAGES} />
                </Field>

                <Field label="최근 12개월 누적 매출" required>
                  <Select name="revenue_range" required options={REVENUE_RANGES} />
                </Field>

                <Field
                  label="최근 6개월 매출 또는 핵심 사업지표의 흐름"
                  required
                  hint="매출이 없는 기업은 테스트 고객·PoC·활성 사용자·계약 예정 고객 등을 기준으로"
                >
                  <RadioList name="growth_trend" required options={GROWTH_TRENDS} />
                </Field>

                <Field
                  label="현재 가장 먼저 해결해야 할 문제"
                  required
                  hint="최대 3개"
                >
                  <CheckList name="priorities" options={PRIORITIES} />
                </Field>

                <Field
                  label="향후 12개월 목표 · 이번 진단에서 확인하고 싶은 내용"
                  required
                  hint="가능하면 숫자와 시점 포함"
                >
                  <Textarea
                    name="goals"
                    required
                    rows={5}
                    placeholder={`예시)\n12개월 목표: 2027년 6월까지 연매출 30억원과 유료 고객 100개 확보\n확인하고 싶은 내용: 현재 사업모델로 투자유치가 가능한지와 우선 강화해야 할 부분`}
                  />
                </Field>
              </Section>

              {/* ── 04 자료 첨부 ── */}
              <Section index="04" title="자료 첨부">
                <FileField
                  name="ir_deck"
                  required
                  label="IR Deck"
                  hint="PDF · PPT · Keynote · 최대 20MB"
                  description="회사 소개서 또는 사업계획서로 대체 가능합니다."
                  accept=".pdf,.pptx,.ppt,.key,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                />
                <FileField
                  name="business_cert"
                  label="사업자등록증"
                  hint="선택 · PDF · JPG · 최대 5MB"
                  description="사업자등록 전이라면 비워두셔도 됩니다. 업로드 시 자동으로 「사업자등록증_{기업명}」으로 저장됩니다."
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                />
                <FileField
                  name="company_intro"
                  label="회사소개서"
                  hint="선택 · IR Deck과 별도의 간단한 소개 자료가 있으면"
                  description="원페이지 소개서 · 미디어킷 등"
                  accept=".pdf,.pptx,.ppt,.key,.docx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
              </Section>

              {/* ── 05 마지막 ── */}
              <Section index="05" title="마지막">
                <Field label="하임을 알게 된 경로">
                  <Select name="channel" options={CHANNELS} />
                </Field>

                <label
                  className="flex items-start gap-3.5 p-5 rounded-lg cursor-pointer"
                  style={{ background: "#F7F5EF", border: "1px solid #E2DDD1" }}
                >
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    className="w-[18px] h-[18px] mt-0.5 accent-[#41566B] shrink-0"
                  />
                  <span
                    className="text-[14px] leading-relaxed"
                    style={{ color: "#5D6B7A" }}
                  >
                    <b style={{ color: "#1F2A36" }}>
                      개인정보 및 기업정보 활용에 동의합니다.
                    </b>
                    <br />
                    제출하신 정보는 검토·회신·계약 검토 목적으로만 사용되며, 외부
                    제3자에게 공유되지 않습니다.
                  </span>
                </label>
              </Section>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="group w-full inline-flex items-center justify-center gap-3 h-16 rounded-xl text-[16.5px] font-semibold text-white transition-all hover:shadow-lg active:scale-[0.99]"
                  style={{
                    backgroundColor: "#2E4056",
                    boxShadow: "0 6px 20px rgba(46, 64, 86, 0.25)",
                  }}
                >
                  <span>신청서 제출하기</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
                <p
                  className="mt-4 text-[12.5px] text-center"
                  style={{ color: "#8A9099" }}
                >
                  제출 후 접수 확인 이메일이 자동으로 발송됩니다.
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════
function TrustStat({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[30px] font-semibold text-white tracking-tight leading-none">
        {n}
      </div>
      <div className="mt-2 text-[11.5px] text-white/60 tracking-wide">{label}</div>
    </div>
  );
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div
        className="shrink-0 font-mono text-[11px] tracking-[0.14em] pt-0.5"
        style={{ color: "#FFB59E" }}
      >
        {n}
      </div>
      <div>
        <div className="text-[15px] font-semibold text-white mb-1">{title}</div>
        <div className="text-[13.5px] leading-[1.65] text-white/70">{body}</div>
      </div>
    </div>
  );
}

function ProcessStep({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <li className="flex items-center gap-4">
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold"
        style={{
          background: "rgba(255,255,255,0.08)",
          color: "#FFB59E",
          border: "1px solid rgba(255,181,158,0.35)",
        }}
      >
        {n}
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-[14.5px] font-medium text-white">{title}</div>
        <div className="text-[12px] text-white/50">{desc}</div>
      </div>
    </li>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="flex items-baseline gap-3.5 mb-7 pb-4"
        style={{ borderBottom: "1px solid #E2DDD1" }}
      >
        <span
          className="text-[24px] font-extrabold leading-none"
          style={{ color: "#C74815", letterSpacing: "0" }}
        >
          {index}
        </span>
        <h3
          className="text-[20px] font-semibold tracking-[-0.01em]"
          style={{ color: "#1F2A36" }}
        >
          {title}
        </h3>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>;
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <label
          className="text-[14px] font-medium tracking-[-0.005em]"
          style={{ color: "#1F2A36" }}
        >
          {label}
          {required ? (
            <span style={{ color: "#C74815" }} className="ml-0.5">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <span className="text-[12px]" style={{ color: "#8A9099" }}>
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-12 px-4 rounded-lg text-[15.5px] bg-white transition-all placeholder:text-[#B7B0A2] focus:outline-none focus:border-[#41566B] focus:shadow-[0_0_0_3px_rgba(65,86,107,0.08)]"
      style={{
        border: "1px solid #E2DDD1",
        color: "#1F2A36",
        ...(props.style ?? {}),
      }}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-4 py-3.5 rounded-lg text-[15.5px] leading-relaxed bg-white transition-all placeholder:text-[#B7B0A2] focus:outline-none focus:border-[#41566B] focus:shadow-[0_0_0_3px_rgba(65,86,107,0.08)] resize-none"
      style={{
        border: "1px solid #E2DDD1",
        color: "#1F2A36",
      }}
    />
  );
}

function Select({
  name,
  required,
  options,
}: {
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      required={required}
      defaultValue=""
      className="w-full h-12 px-4 rounded-lg text-[15.5px] bg-white appearance-none transition-all focus:outline-none focus:border-[#41566B] focus:shadow-[0_0_0_3px_rgba(65,86,107,0.08)]"
      style={{
        border: "1px solid #E2DDD1",
        color: "#1F2A36",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%235D6B7A' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: "40px",
      }}
    >
      <option value="" disabled>
        — 선택 —
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function RadioList({
  name,
  required,
  options,
}: {
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="group flex items-center gap-3 px-4 py-3.5 rounded-lg cursor-pointer text-[14.5px] transition-all bg-white hover:border-[#41566B]/40 has-[:checked]:border-[#41566B] has-[:checked]:bg-[#41566B]/[0.04]"
          style={{ border: "1px solid #E2DDD1" }}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            required={required}
            className="w-4 h-4 accent-[#41566B]"
          />
          <span style={{ color: "#1F2A36" }}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function CheckList({
  name,
  options,
}: {
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="group flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-[14.5px] transition-all bg-white hover:border-[#41566B]/40 has-[:checked]:border-[#41566B] has-[:checked]:bg-[#41566B]/[0.04]"
          style={{ border: "1px solid #E2DDD1" }}
        >
          <input
            type="checkbox"
            name={name}
            value={o.value}
            className="w-4 h-4 accent-[#41566B]"
          />
          <span style={{ color: "#1F2A36" }}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function FileField({
  name,
  label,
  hint,
  description,
  required,
  accept,
}: {
  name: string;
  label: string;
  hint?: string;
  description?: string;
  required?: boolean;
  accept?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <label
        className="block rounded-xl px-6 py-6 cursor-pointer transition-all hover:border-[#41566B]/60 hover:bg-[#F9FAFB]"
        style={{
          border: "1.5px dashed #D6D6D6",
          backgroundColor: "#FCFCFC",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center"
            style={{ background: "#F0F1F3" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A6E52" strokeWidth="1.6">
              <path d="M12 15V3M12 3l-4 4M12 3l4 4" />
              <path d="M20 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium mb-0.5" style={{ color: "#1F2A36" }}>
              파일을 선택해주세요
            </div>
            {description ? (
              <div className="text-[11.5px] leading-relaxed" style={{ color: "#8A9099" }}>
                {description}
              </div>
            ) : null}
          </div>
        </div>
        <input
          type="file"
          name={name}
          required={required}
          accept={accept}
          className="mt-3 text-[12px] w-full"
          style={{ color: "#5D6B7A" }}
        />
      </label>
    </Field>
  );
}
