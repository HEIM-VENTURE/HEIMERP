"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  Video,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
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
      { href: "/admin/projects", label: "프로젝트", icon: Kanban },
      { href: "/admin/deals", label: "투자 딜", icon: Coins },
      { href: "/admin/monitoring", label: "사후 모니터링", icon: LineChart, comingSoon: true },
    ],
  },
  {
    label: "운영",
    items: [
      { href: "/admin/demoday", label: "데모데이", icon: Video },
      { href: "/admin/contracts", label: "계약", icon: Receipt },
      { href: "/admin/meetings", label: "미팅 · 회의록", icon: CalendarDays },
    ],
  },
  {
    label: "자료실",
    items: [
      { href: "/admin/tips", label: "TIPS 운영사", icon: Landmark },
      { href: "/admin/companies", label: "기업 마스터", icon: Building2 },
      { href: "/admin/paid-customers", label: "고객 현황표", icon: ClipboardList },
    ],
  },
];

type Props = {
  profile: { name: string; email: string; role: string };
  onNavigate?: () => void;
};

const COLLAPSE_STORAGE_KEY = "heim-erp:admin-sidebar:collapsed";

export function AdminSidebar({ profile, onNavigate }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 초기값을 localStorage에서 복원 (SSR 대응 위해 useEffect)
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-zinc-200 py-5 flex flex-col shrink-0 transition-[width] duration-200 ease-out",
        collapsed ? "w-16 px-2" : "w-60 px-3",
      )}
    >
      {/* 로고 + 접기 토글 */}
      <div className={cn("mb-6 flex items-center", collapsed ? "flex-col gap-3" : "gap-2 px-2")}>
        <div
          className={cn(
            "relative overflow-hidden shrink-0",
            collapsed ? "w-9 h-9" : "flex-1 h-11",
          )}
        >
          <Image
            src={collapsed ? "/heim-logo-mark.png" : "/heim-logo-horizontal.jpg"}
            alt="HEIM VENTURE INVESTMENT"
            fill
            sizes={collapsed ? "36px" : "200px"}
            priority
            className={cn(collapsed ? "object-contain" : "object-cover object-center")}
          />
        </div>
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors shrink-0 hidden lg:inline-flex"
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <ChevronsLeft className="w-4 h-4" />
          )}
        </button>
      </div>
      {!collapsed ? (
        <div className="text-[10px] text-zinc-400 mb-4 px-2 -mt-3">ERP · 관리자</div>
      ) : null}

      <nav className="flex-1 overflow-y-auto text-sm">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className="mb-4">
            {collapsed ? (
              gi > 0 ? <div className="mx-2 my-2 border-t border-zinc-100" /> : null
            ) : (
              <div className="px-3 text-[10px] font-medium uppercase text-zinc-400 mb-1.5">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href) && !item.comingSoon;
                const Icon = item.icon;
                if (item.comingSoon) {
                  return (
                    <div
                      key={item.href}
                      className={cn(
                        "flex items-center rounded-lg text-zinc-400 cursor-not-allowed",
                        collapsed ? "justify-center py-2" : "gap-2.5 px-3 py-2",
                      )}
                      title={collapsed ? `${item.label} (곧 공개)` : "곧 공개"}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0 text-zinc-300" />
                      {!collapsed ? (
                        <>
                          <span className="flex-1">{item.label}</span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium uppercase">
                            soon
                          </span>
                        </>
                      ) : null}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg transition-colors",
                      collapsed ? "justify-center py-2" : "gap-2.5 px-3 py-2",
                      active
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0",
                        active ? "text-brand" : "text-zinc-400",
                      )}
                    />
                    {!collapsed ? (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand text-white font-medium tabular-nums">
                            {item.badge}
                          </span>
                        ) : null}
                      </>
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
          title={collapsed ? "설정" : undefined}
          className={cn(
            "flex items-center rounded-lg transition-colors",
            collapsed ? "justify-center py-2" : "gap-2.5 px-3 py-2",
            pathname.startsWith("/admin/settings")
              ? "bg-brand/10 text-brand font-semibold"
              : "text-zinc-600 hover:bg-zinc-100",
          )}
        >
          <Settings
            className={cn(
              "w-[18px] h-[18px] shrink-0",
              pathname.startsWith("/admin/settings") ? "text-brand" : "text-zinc-400",
            )}
          />
          {!collapsed ? <span>설정</span> : null}
        </Link>
      </nav>

      <div
        className={cn(
          "mt-4 pt-4 border-t border-zinc-100",
          collapsed ? "flex flex-col items-center gap-2" : "px-2",
        )}
      >
        {collapsed ? (
          <div
            className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700"
            title={`${profile.name} · ${profile.email}`}
          >
            {profile.name.slice(0, 1)}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}
