"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  Inbox,
  Users,
  Receipt,
  CalendarDays,
  Landmark,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/pipeline", label: "기업 파이프라인", icon: Workflow },
  { href: "/admin/todos", label: "할 일 (To-do)", icon: ListChecks },
  { href: "/admin/applications", label: "신청자 / 접수", icon: Inbox },
  { href: "/admin/hvp", label: "HVP 관리", icon: Users },
  { href: "/admin/contracts", label: "계약 · 수수료", icon: Receipt },
  { href: "/admin/meetings", label: "미팅 · 회의록", icon: CalendarDays },
  { href: "/admin/tips", label: "TIPS 운영사", icon: Landmark },
];

type Props = {
  profile: { name: string; email: string; role: string };
  /** 모바일 드로어에서 메뉴 클릭 시 자동 닫기용 */
  onNavigate?: () => void;
};

export function AdminSidebar({ profile, onNavigate }: Props) {
  const pathname = usePathname();

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
        <div className="text-[10px] text-zinc-400 mt-2.5">ERP · 관리자</div>
      </div>

      <nav className="space-y-0.5 text-sm">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
                active
                  ? "bg-brand/10 text-brand font-semibold"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-brand" : "text-zinc-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="border-t border-zinc-100 my-3" />
        <Link
          href="/admin/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
            pathname.startsWith("/admin/settings")
              ? "bg-brand/10 text-brand font-semibold"
              : "text-zinc-600 hover:bg-zinc-100"
          )}
        >
          <Settings className={cn("w-[18px] h-[18px] shrink-0", pathname.startsWith("/admin/settings") ? "text-brand" : "text-zinc-400")} />
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
        <div className="mb-2">
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
