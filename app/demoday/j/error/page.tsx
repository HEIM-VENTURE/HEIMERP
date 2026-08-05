import Image from "next/image";
import { AlertCircle } from "lucide-react";

export const metadata = { title: "링크 오류 · HEIM Venture Investment" };

export default function ErrorPage() {
  return (
    <div
      className="min-h-screen font-sans flex flex-col"
      style={{ background: "#FBFAF5" }}
    >
      <header
        className="border-b"
        style={{ background: "rgba(255,255,255,0.9)", borderColor: "#E8E4DA" }}
      >
        <div className="mx-auto max-w-md px-4 py-3 flex items-center">
          <div className="relative h-7 w-28">
            <Image
              src="/heim-logo-mark.png"
              alt="HEIM VENTURE INVESTMENT"
              fill
              sizes="112px"
              className="object-contain object-left"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-md w-full px-4 py-16">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-[18px] font-bold text-zinc-900 mb-2">
            유효하지 않은 링크입니다
          </h1>
          <p className="text-[13px] text-zinc-600 leading-relaxed">
            링크가 만료되었거나 잘못된 주소일 수 있습니다.
            <br />
            아래로 문의 부탁드립니다.
          </p>
          <a
            href="mailto:admin@heimvi.com"
            className="inline-block mt-6 h-11 leading-[44px] px-5 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
          >
            admin@heimvi.com
          </a>
        </div>
      </main>

      <footer
        className="border-t py-4 text-center text-[11px] text-zinc-500"
        style={{ borderColor: "#E8E4DA" }}
      >
        HEIM VENTURE INVESTMENT
      </footer>
    </div>
  );
}
