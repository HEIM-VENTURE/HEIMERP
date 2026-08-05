import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateWizard } from "./create-wizard";

export const metadata = { title: "새 데모데이 · HEIM ERP" };

export default function NewDemoDayPage() {
  return (
    <>
      <Link
        href="/admin/demoday"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        데모데이
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">새 데모데이 만들기</h1>
      <p className="text-sm text-zinc-500 mb-6">
        회차 정보 · 참여 스타트업 · 심사역 초청 순서로 설정하세요.
      </p>
      <CreateWizard />
    </>
  );
}
