"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Languages,
  HelpCircle,
  ChevronRight,
  Camera,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/labels";

type Profile = { name: string; email: string; role: string };
type Tab = "account" | "notifications" | "privacy" | "languages" | "help";

const NAV: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "account", label: "계정", icon: User },
  { key: "notifications", label: "알림", icon: Bell },
  { key: "privacy", label: "개인정보", icon: Shield },
  { key: "languages", label: "언어", icon: Languages },
  { key: "help", label: "도움말", icon: HelpCircle },
];

export function SettingsView({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>("account");

  return (
    <div className="relative">
      {/* 장식 블러 */}
      <div className="pointer-events-none absolute -top-10 right-10 w-72 h-72 rounded-full bg-brand/10 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-40 -left-10 w-60 h-60 rounded-full bg-[#ff6a3d]/10 blur-3xl -z-10" />

      <h1 className="text-2xl font-bold text-zinc-900 mb-5">설정</h1>

      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden flex min-h-[560px] shadow-sm">
        {/* 좌측 서브내비 */}
        <aside className="w-56 shrink-0 border-r border-zinc-100 p-5 bg-zinc-50/40">
          <div className="text-lg font-bold text-zinc-900 px-2 mb-4">Settings</div>
          <nav className="space-y-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setTab(n.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left",
                    active
                      ? "bg-brand/10 text-brand font-semibold"
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-brand" : "text-zinc-400")} />
                  {n.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 우측 콘텐츠 */}
        <section className="flex-1 p-8 min-w-0">
          {tab === "account" ? (
            <AccountPanel profile={profile} />
          ) : (
            <Placeholder label={NAV.find((n) => n.key === tab)?.label ?? ""} />
          )}
        </section>
      </div>
    </div>
  );
}

function AccountPanel({ profile }: { profile: Profile }) {
  const roleLabel = ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role;
  return (
    <>
      <h2 className="text-xl font-bold text-zinc-900">계정 설정</h2>

      <h3 className="text-sm font-semibold text-zinc-500 mt-8 mb-4">기본 정보</h3>

      {/* 프로필 사진 */}
      <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand to-[#4d3ca8] text-white flex items-center justify-center text-xl font-bold">
            {profile.name?.slice(0, 1) ?? "?"}
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
            <Camera className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-sm">
          <div className="font-medium text-zinc-700">프로필 사진</div>
          <div className="text-xs text-zinc-400 mt-0.5">사진 업로드 (준비 중)</div>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        <Row label="이름" value={profile.name} />
        <Row label="이메일" value={profile.email} />
        <Row label="역할" value={roleLabel} />
      </div>

      <h3 className="text-sm font-semibold text-zinc-500 mt-9 mb-4">계정 정보</h3>
      <div className="divide-y divide-zinc-100">
        <Row label="로그인 방식" value="Google 계정" />
        <Row label="비밀번호" value="Google 계정으로 관리" muted />
      </div>
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 group">
      <span className="text-sm text-zinc-500 w-32 shrink-0">{label}</span>
      <span className={cn("flex-1 text-sm truncate", muted ? "text-zinc-400" : "text-zinc-900")}>{value}</span>
      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-400 shrink-0" />
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-20">
      <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-3">
        <Bell className="w-6 h-6" />
      </div>
      <div className="text-zinc-900 font-medium">{label}</div>
      <div className="text-sm text-zinc-400 mt-1">준비 중입니다</div>
    </div>
  );
}
