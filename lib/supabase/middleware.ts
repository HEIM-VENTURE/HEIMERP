import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 모든 요청마다 세션 쿠키를 갱신하고, 인증 여부에 따라 리다이렉트.
 * - 비로그인 사용자가 보호된 경로 접근 시 → / (로그인) 으로
 * - 로그인 사용자가 / 에 접근 시 → 역할별 대시보드로
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // env 누락 시 500 대신 그냥 통과 (보호 경로면 페이지에서 다시 차단)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 중요: getUser() 호출이 세션 검증 및 쿠키 갱신을 트리거함
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPath = pathname === "/" || pathname.startsWith("/auth");
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/hvp") ||
    pathname.startsWith("/company");

  // 비로그인 + 보호 경로 → 로그인으로
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // (선택) 로그인 + 루트 → 역할에 맞는 대시보드로
  // 역할 조회는 별도 테이블(profiles)에서. 일단 단순히 admin으로.
  // 추후 profile.role을 읽어 분기.

  return supabaseResponse;
}
