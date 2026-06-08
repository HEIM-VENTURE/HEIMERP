"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/hvp/dashboard", label: "내 대시보드" },
  { href: "/hvp/companies", label: "내 기업" },
  { href: "/hvp/submit", label: "기업 접수하기" },
  { href: "/hvp/fees", label: "수수료 내역" },
  { href: "/hvp/notifications", label: "알림" },
];

type Props = {
  profile: { name: string; email: string; role: string };
  hvpInfo: { name: string; cohort: string | null } | null;
  /** 모바일 드로어에서 메뉴 클릭 시 자동 닫기용 */
  onNavigate?: () => void;
};

export function HvpSidebar({ profile, hvpInfo, onNavigate }: Props) {
  const pathname = usePathname();
  const displayName = hvpInfo?.name ?? profile.name;
  const cohort = hvpInfo?.cohort ?? "";

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-zinc-200 px-3 py-5 flex flex-col shrink-0">
      <div className="px-2 mb-7">
        <div className="relative w-full h-11 overflow-hidden">
          <Image
            src="/heim-logo-horizontal.jpg"
            alt="HEIM VENTURE INVESTMENT"
            fill
            sizes="200px"
            priority
            className="object-cover object-center"
          />
        </div>
        <div className="text-[10px] text-zinc-400 mt-2.5">
          ERP · HVP{cohort ? ` · ${cohort}` : ""}
        </div>
      </div>

      <nav className="space-y-0.5 text-sm">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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
          href="/hvp/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          <span>내 프로필</span>
        </Link>
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-100 px-2">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700 shrink-0">
            {displayName.slice(0, 1)}
          </div>
          <div className="text-xs min-w-0 flex-1">
            <div className="font-medium text-zinc-900 truncate">{displayName}</div>
            <div className="text-zinc-400 truncate">{cohort ? `${cohort} · HVP` : "HVP"}</div>
          </div>
        </div>
        <div className="mb-2">
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
