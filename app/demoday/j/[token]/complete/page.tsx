import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type Props = { params: Promise<{ token: string }> };

export default async function CompletePage({ params }: Props) {
  const { token } = await params;
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
      </div>
      <h1 className="text-[20px] font-bold text-zinc-900 mb-2">평가 제출 완료</h1>
      <p className="text-[13.5px] text-zinc-600 leading-relaxed">
        데모데이 참여와 소중한 평가에 감사드립니다.
        <br />
        결과는 요약된 피드백 형태로 각 기업 대표에게 전달됩니다.
      </p>
      <Link
        href={`/demoday/j/${token}`}
        className="inline-block mt-6 h-11 leading-[44px] px-5 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
      >
        참여 기업 목록으로 →
      </Link>
      <p className="mt-4 text-[11px] text-zinc-500">
        문의: admin@heimvi.com
      </p>
    </div>
  );
}
