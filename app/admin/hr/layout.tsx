import Link from "next/link";
import { Users2, CalendarCheck2 } from "lucide-react";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-zinc-900">인사관리</h1>
        <p className="text-sm text-zinc-500 mt-1">
          멤버 관리 · 연차 신청과 승인 · 잔여 연차 집계.
        </p>
      </div>
      <nav className="flex items-center gap-1 mb-6 border-b border-zinc-200">
        <SubTab href="/admin/hr/leaves" label="연차" icon={<CalendarCheck2 className="w-3.5 h-3.5" />} />
        <SubTab href="/admin/hr/members" label="멤버" icon={<Users2 className="w-3.5 h-3.5" />} />
      </nav>
      {children}
    </>
  );
}

function SubTab({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] rounded-t-md transition-colors -mb-px border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 data-[active=true]:border-brand data-[active=true]:text-zinc-900 data-[active=true]:font-medium"
    >
      {icon}
      {label}
    </Link>
  );
}
