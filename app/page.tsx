import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { loginAction } from "./auth/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  // 이미 로그인된 사용자라면 역할에 맞는 대시보드로
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") redirect("/admin/dashboard");
    if (profile?.role === "hvp") redirect("/hvp/dashboard");
    redirect("/company/dashboard");
  }

  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/heim-logo-square.jpg"
            alt="HEIM VENTURE INVESTMENT"
            width={120}
            height={120}
            className="w-28 h-28 object-contain mb-3"
            priority
          />
          <h1 className="text-lg font-semibold text-zinc-700">HEIM VENTURE INVESTMENT</h1>
        </div>

        <form
          action={loginAction}
          className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm space-y-4"
        >
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-zinc-700 mb-1.5 block">
              이메일
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@heimvi.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-zinc-700 mb-1.5 block">
              비밀번호
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full">
            로그인
          </Button>

          <div className="pt-5 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 mb-1">
              관리자 계정: <span className="text-zinc-600">admin@heimvi.com</span>
            </p>
            <p className="text-xs text-zinc-400">
              Supabase Dashboard에서 추가 사용자 생성 후 로그인하세요.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
