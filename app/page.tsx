import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

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

        <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm space-y-4">
          {/* Google 로그인 */}
          <GoogleLoginButton />

          {error ? (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          ) : null}

          <div className="pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              💡 HVP는 신청서 작성 후 관리자 승인을 받으셔야 합니다.<br />
              승인 후 본인 <b>Google 계정</b>으로 로그인하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
