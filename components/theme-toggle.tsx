"use client";

import { useEffect, useState } from "react";

/**
 * 라이트/다크 테마 토글.
 * <html>에 .dark 클래스를 붙였다 떼고 localStorage에 저장.
 * 초기 적용은 layout의 인라인 스크립트가 처리(깜빡임 방지).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition"
      title="라이트/다크 전환"
    >
      {mounted && dark ? (
        <>
          <span>☀️</span>
          <span>라이트 모드</span>
        </>
      ) : (
        <>
          <span>🌙</span>
          <span>다크 모드</span>
        </>
      )}
    </button>
  );
}
