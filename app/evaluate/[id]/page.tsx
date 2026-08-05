import { notFound } from "next/navigation";
import Image from "next/image";
import { findDemoDayById, SCORE_DIMENSIONS } from "@/lib/mock-demoday";
import { EvaluationForm } from "./evaluation-form";

export const metadata = { title: "데모데이 평가 · HEIM Venture Investment" };

type Props = { params: Promise<{ id: string }> };

export default async function EvaluatePage({ params }: Props) {
  const { id } = await params;
  const d = findDemoDayById(id);
  if (!d) return notFound();

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FBFAF5" }}>
      {/* Header */}
      <header
        className="border-b sticky top-0 z-10"
        style={{
          background: "rgba(255,255,255,0.85)",
          borderColor: "#E8E4DA",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center gap-4">
          <div className="relative h-8 w-36 shrink-0">
            <Image
              src="/heim-logo-mark.png"
              alt="HEIM VENTURE INVESTMENT"
              fill
              sizes="150px"
              priority
              className="object-contain object-left"
            />
          </div>
          <div className="text-[11px] text-zinc-500 hidden sm:block">
            {d.title} · {d.date} · {d.time}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: "#C74815" }}>
            Demo Day Evaluation
          </div>
          <h1
            className="text-[28px] leading-[1.25] tracking-[-0.02em] font-bold mb-3 text-balance"
            style={{ color: "#1F2A36" }}
          >
            {d.title} · 평가
          </h1>
          <p className="text-[14.5px] leading-relaxed" style={{ color: "#5D6B7A" }}>
            총 <b style={{ color: "#1F2A36" }}>{d.startups.length}곳</b>의 스타트업을 평가해주세요.
            각 항목 5점 척도이며, 정확한 판단이 어려운 항목은 3점(중간)으로 두셔도 됩니다.
            제출된 평가는 하임벤처투자 심사역만 조회하며, 대표에게는 요약된 피드백 형태로만 전달됩니다.
          </p>
        </div>

        <EvaluationForm demoday={d} />
      </main>

      <footer className="border-t py-6 text-center text-[11.5px] text-zinc-500" style={{ borderColor: "#E8E4DA" }}>
        HEIM VENTURE INVESTMENT · admin@heimvi.com
      </footer>
    </div>
  );
}
