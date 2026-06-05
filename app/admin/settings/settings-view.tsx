"use client";

import { useRef, useState, useTransition } from "react";
import {
  User,
  Bell,
  Shield,
  Languages,
  HelpCircle,
  Camera,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction, uploadAvatarAction, removeAvatarAction } from "./actions";

type Profile = {
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
};
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
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] shrink-0",
                      active ? "text-brand" : "text-zinc-400"
                    )}
                  />
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveBasic = () => {
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", phone);
    startTransition(async () => {
      const r = await updateProfileAction(fd);
      if (r.error) setError(r.error);
      else {
        setSuccess("저장됨");
        setEditing(false);
      }
    });
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set("file", f);
    startTransition(async () => {
      const r = await uploadAvatarAction(fd);
      if (r.error) setError(r.error);
      else if (r.avatarUrl) {
        setAvatarUrl(r.avatarUrl);
        setSuccess("사진 변경됨");
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const onRemoveAvatar = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await removeAvatarAction();
      if (r.error) setError(r.error);
      else {
        setAvatarUrl(null);
        setSuccess("사진 제거됨");
      }
    });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="text-xl font-bold text-zinc-900">계정 설정</h2>
        {(success || error) && (
          <div
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium",
              error
                ? "bg-rose-100 text-rose-700"
                : "bg-green-100 text-green-700"
            )}
          >
            {error ?? success}
          </div>
        )}
      </div>

      <h3 className="text-sm font-semibold text-zinc-500 mt-8 mb-4">기본 정보</h3>

      {/* 프로필 사진 */}
      <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover border border-zinc-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand to-[#4d3ca8] text-white flex items-center justify-center text-xl font-bold">
              {profile.name?.slice(0, 1) ?? "?"}
            </div>
          )}
          <button
            type="button"
            onClick={onPickFile}
            disabled={pending}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-brand hover:border-brand/40 transition disabled:opacity-50"
            title="사진 변경"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-medium text-zinc-700">프로필 사진</div>
          <div className="text-xs text-zinc-400 mt-0.5">JPG · PNG · WebP · GIF · 최대 5MB</div>
          {avatarUrl ? (
            <button
              type="button"
              onClick={onRemoveAvatar}
              disabled={pending}
              className="text-xs text-rose-600 hover:text-rose-700 mt-1.5 disabled:opacity-50"
            >
              사진 제거
            </button>
          ) : null}
        </div>
      </div>

      {/* 기본 정보 행들 */}
      {editing ? (
        <div className="space-y-3 pt-2">
          <Field label="이름">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
          </Field>
          <Field label="전화">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="text-sm"
            />
          </Field>
          <div className="flex gap-2 pt-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setName(profile.name);
                setPhone(profile.phone ?? "");
                setError(null);
              }}
              disabled={pending}
            >
              취소
            </Button>
            <Button onClick={saveBasic} disabled={pending || !name.trim()}>
              {pending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="divide-y divide-zinc-100">
            <Row label="이름" value={profile.name} />
            <Row label="이메일" value={profile.email} muted />
            <Row label="전화" value={profile.phone || "—"} muted={!profile.phone} />
            <Row label="역할" value={roleLabel} muted />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              기본 정보 편집
            </Button>
          </div>
        </>
      )}

      <h3 className="text-sm font-semibold text-zinc-500 mt-9 mb-4">계정 정보</h3>
      <div className="divide-y divide-zinc-100">
        <Row label="로그인 방식" value="Google 계정" muted />
        <Row label="비밀번호" value="Google 계정으로 관리" muted />
      </div>
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm text-zinc-500 w-32 shrink-0">{label}</span>
      <span className={cn("flex-1 text-sm truncate", muted ? "text-zinc-400" : "text-zinc-900")}>
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-600 mb-1 block">{label}</label>
      {children}
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
