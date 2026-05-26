"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/hvp/dashboard", label: "내 대시보드" },
  { href: "/hvp/companies", label: "내 기업", count: 12 },
  { href: "/hvp/submit", label: "기업 접수하기", plus: true },
  { href: "/hvp/fees", label: "수수료 내역" },
  { href: "/hvp/notifications", label: "알림", badge: 2 },
];

export function HvpSidebar() {
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
        <div className="text-[10px] text-zinc-400 mt-1.5 ml-0.5">ERP · HVP · 5기</div>
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
              {item.count !== undefined ? (
                <span className="ml-auto text-[10px] text-zinc-400">{item.count}</span>
              ) : null}
              {item.plus ? (
                <span className="ml-auto text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded">+</span>
              ) : null}
              {item.badge ? (
                <span className="ml-auto text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        <div className="border-t border-zinc-100 my-3" />
        <Link
          href="/hvp/profile"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          <span>내 프로필</span>
        </Link>
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-100 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">
            민
          </div>
          <div className="text-xs">
            <div className="font-medium text-zinc-900">김민준</div>
            <div className="text-zinc-400">5기 · HVP</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
