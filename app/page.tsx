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
    <div className="min-h-screen flex items-center justify-center bg-[#f6f4fc] px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid lg:grid-cols-2">
        {/* 좌측: 로그인 폼 */}
        <div className="p-9 sm:p-12 flex flex-col justify-center">
          <Image
            src="/heim-logo-horizontal.jpg"
            alt="HEIM VENTURE INVESTMENT"
            width={260}
            height={52}
            className="h-12 w-auto object-contain"
            priority
          />

          <h1 className="text-2xl font-bold text-zinc-900 mt-9">환영합니다</h1>
          <p className="text-sm text-zinc-500 mt-2">
            HEIM VENTURE INVESTMENT 운영 시스템에 로그인하세요.
          </p>

          <div className="mt-8 space-y-4">
            <GoogleLoginButton />

            {error ? (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            ) : null}

            <div className="pt-5 border-t border-zinc-100">
              <p className="text-xs text-zinc-400 leading-relaxed">
                💡 HVP는 신청서 작성 후 관리자 승인을 받으셔야 합니다.<br />
                승인 후 본인 <b>Google 계정</b>으로 로그인하세요.
              </p>
            </div>
          </div>
        </div>

        {/* 우측: 브랜드 그라데이션 패널 (데스크탑) */}
        <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#9580dc] via-[#6d5dd3] to-[#4d3ca8] p-12 flex-col justify-end">
          {/* 장식용 블러 원 */}
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute top-24 -left-12 w-52 h-52 rounded-full bg-[#ff6a3d]/25 blur-2xl" />
          <div className="absolute -bottom-20 right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="text-4xl font-bold tracking-tight text-white">HEIM</div>
            <div className="text-sm font-medium tracking-[0.3em] text-white/70 mt-1">
              VENTURE INVESTMENT
            </div>
            <p className="text-white/80 text-sm mt-6 leading-relaxed max-w-xs">
              접수부터 TIPS 선정까지, 컨설팅 파이프라인을 한 곳에서 관리합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
