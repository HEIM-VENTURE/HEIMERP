"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  Receipt,
  CalendarDays,
  Landmark,
  Settings,
  Inbox,
  Kanban,
  Coins,
  LineChart,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "오늘",
    items: [
      { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
      { href: "/admin/todos", label: "할 일", icon: ListChecks },
    ],
  },
  {
    label: "기업 성장 여정",
    items: [
      { href: "/admin/applications", label: "기업 접수", icon: Inbox },
      { href: "/admin/pipeline", label: "기업 파이프라인", icon: Workflow },
      { href: "/admin/projects", label: "프로젝트", icon: Kanban, comingSoon: true },
      { href: "/admin/deals", label: "투자 딜", icon: Coins, comingSoon: true },
      { href: "/admin/monitoring", label: "사후 모니터링", icon: LineChart, comingSoon: true },
    ],
  },
  {
    label: "운영",
    items: [
      { href: "/admin/contracts", label: "계약", icon: Receipt },
      { href: "/admin/meetings", label: "미팅 · 회의록", icon: CalendarDays },
    ],
  },
  {
    label: "자료실",
    items: [
      { href: "/admin/tips", label: "TIPS 운영사", icon: Landmark },
      { href: "/admin/companies", label: "기업 마스터", icon: Building2, comingSoon: true },
    ],
  },
];

type Props = {
  profile: { name: string; email: string; role: string };
  onNavigate?: () => void;
};

export function AdminSidebar({ profile, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-zinc-200 px-3 py-5 flex flex-col shrink-0">
      <div className="px-2 mb-6">
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

      <nav className="flex-1 overflow-y-auto text-sm">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-3 text-[10px] font-medium tracking-wider uppercase text-zinc-400 mb-1.5">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href) && !item.comingSoon;
                const Icon = item.icon;
                if (item.comingSoon) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 cursor-not-allowed"
                      title="곧 공개"
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0 text-zinc-300" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium tracking-wider uppercase">
                        soon
                      </span>
                    </div>
                  );
                }
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
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0",
                        active ? "text-brand" : "text-zinc-400"
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand text-white font-medium tabular-nums">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="border-t border-zinc-100 my-2" />
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
          <Settings
            className={cn(
              "w-[18px] h-[18px] shrink-0",
              pathname.startsWith("/admin/settings") ? "text-brand" : "text-zinc-400"
            )}
          />
          <span>설정</span>
        </Link>
      </nav>

      <div className="mt-4 pt-4 border-t border-zinc-100 px-2">
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
