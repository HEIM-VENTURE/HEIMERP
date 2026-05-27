"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/auth/actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
      className="text-[11px] text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
      title="로그아웃"
    >
      {pending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
