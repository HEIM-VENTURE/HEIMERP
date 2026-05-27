import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (Google) 콜백 처리.
 * Google 인증 후 Supabase가 이 URL로 redirect함.
 * code를 session으로 교환하고, 역할에 맞는 대시보드로 보냄.
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent("Google 로그인 실패: " + errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent("인증 코드 없음")}`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent("세션 생성 실패: " + exchangeError.message)}`
    );
  }

  // profile 조회 후 역할별 redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent("사용자 정보 없음")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") return NextResponse.redirect(`${origin}/admin/dashboard`);
  if (profile?.role === "hvp") return NextResponse.redirect(`${origin}/hvp/dashboard`);
  return NextResponse.redirect(`${origin}/company/dashboard`);
}
