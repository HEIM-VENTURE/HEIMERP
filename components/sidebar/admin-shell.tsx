"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./admin-sidebar";

type Profile = { name: string; email: string; role: string };

/**
 * Admin 레이아웃 쉘 — 반응형 사이드바.
 * - lg 미만: 사이드바를 드로어로(햄버거 버튼으로 열고, 백드롭 클릭/메뉴 클릭으로 닫음)
 * - lg 이상: 고정 사이드바
 */
export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* 모바일 백드롭 */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* 사이드바 래퍼 — lg 미만 fixed translate, lg 이상 static */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out",
          "lg:static lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <AdminSidebar profile={profile} onNavigate={() => setOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* 모바일 전용 상단바 */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-200 sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5 text-zinc-700" />
          </button>
          <div className="relative h-6 w-28">
            <Image
              src="/heim-logo-horizontal.jpg"
              alt="HEIM"
              fill
              sizes="112px"
              priority
              className="object-contain object-left"
            />
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 lg:py-7 overflow-x-auto bg-[#f6f4fc] dark:bg-[#141121]">
          {children}
        </main>
      </div>
    </div>
  );
}
