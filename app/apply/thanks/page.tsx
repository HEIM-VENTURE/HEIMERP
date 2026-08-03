import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "접수 완료 · HEIM Venture Investment",
};

export default function ThanksPage() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: "#FAF8F3", color: "#1A1D22" }}
    >
      <header
        style={{
          backgroundColor: "rgba(250, 248, 243, 0.82)",
          borderBottom: "1px solid #E8E4DA",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="relative h-8 w-40">
            <Image
              src="/heim-logo-horizontal.jpg"
              alt="HEIM VENTURE INVESTMENT"
              fill
              sizes="160px"
              priority
              className="object-contain object-left"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl px-6 py-24 text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-8"
          style={{ backgroundColor: "#E8F1EC" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#237A4E" strokeWidth="2.2">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        <div
          className="text-[11px] font-medium uppercase tracking-[0.16em] mb-4"
          style={{ color: "#E5531F" }}
        >
          Application Received
        </div>

        <h1 className="text-3xl font-semibold tracking-tight mb-5" style={{ color: "#1A1D22" }}>
          신청서가 접수되었습니다.
        </h1>

        <p className="text-[15px] leading-relaxed" style={{ color: "#5C6470" }}>
          제출해주신 정보는 담당 심사역이 검토 후
          <br />
          <b style={{ color: "#1A1D22" }}>5영업일 이내</b>에 등록하신 이메일로 회신드립니다.
        </p>

        <div
          className="mt-10 mx-auto max-w-md px-5 py-4 rounded-xl text-left"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E4DA" }}
        >
          <div className="text-[11px] font-medium tracking-[0.12em] uppercase mb-2" style={{ color: "#8A9099" }}>
            다음 단계
          </div>
          <ul className="text-[13px] space-y-2" style={{ color: "#1A1D22" }}>
            <li className="flex gap-2.5">
              <span style={{ color: "#E5531F" }}>·</span>
              접수 확인 이메일이 방금 발송되었습니다.
            </li>
            <li className="flex gap-2.5">
              <span style={{ color: "#E5531F" }}>·</span>
              담당자가 배정되면 검토 시작 안내를 보내드립니다.
            </li>
            <li className="flex gap-2.5">
              <span style={{ color: "#E5531F" }}>·</span>
              검토 결과에 따라 미팅 일정 링크가 안내됩니다.
            </li>
          </ul>
        </div>

        <div className="mt-10 text-[12px]" style={{ color: "#8A9099" }}>
          문의:{" "}
          <a href="mailto:admin@heimvi.com" style={{ color: "#41566B", textDecoration: "underline" }}>
            admin@heimvi.com
          </a>
          <span className="mx-2">·</span>
          <Link href="/apply" style={{ color: "#41566B", textDecoration: "underline" }}>
            새 신청서 작성
          </Link>
        </div>
      </main>
    </div>
  );
}
