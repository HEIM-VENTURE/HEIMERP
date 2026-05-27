"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/pipeline", label: "기업 파이프라인" },
  { href: "/admin/todos", label: "할 일 (To-do)" },
  { href: "/admin/applications", label: "신청자 / 접수" },
  { href: "/admin/hvp", label: "HVP 관리" },
  { href: "/admin/contracts", label: "계약 · 수수료" },
  { href: "/admin/meetings", label: "미팅 · 회의록" },
  { href: "/admin/tips", label: "TIPS 운영사" },
];

type Props = {
  profile: { name: string; email: string; role: string };
};

export function AdminSidebar({ profile }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-zinc-200 px-3 py-5 flex flex-col shrink-0">
      <div className="px-2 mb-7">
        <Image
          src="/heim-logo-horizontal.jpg"
          alt="HEIM VENTURE INVESTMENT"
          width={200}
          height={40}
          className="h-7 w-auto"
          priority
        />
        <div className="text-[10px] text-zinc-400 mt-1.5 ml-0.5">ERP · 관리자</div>
      </div>

      <nav className="space-y-0.5 text-sm">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg",
                active
                  ? "bg-zinc-100 text-zinc-900 font-medium"
                  : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-zinc-900" : "bg-zinc-300")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="border-t border-zinc-100 my-3" />
        <Link
          href="/admin/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          <span>설정</span>
        </Link>
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-100 px-2">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700 shrink-0">
            {profile.name.slice(0, 1)}
          </div>
          <div className="text-xs min-w-0 flex-1">
            <div className="font-medium text-zinc-900 truncate">{profile.name}</div>
            <div className="text-zinc-400 truncate">{profile.email}</div>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
