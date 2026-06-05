import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 권장 명칭: middleware → proxy
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적/API/이미지 경로는 제외해서 페이지 라우트에서만 세션 갱신:
     * - _next/static, _next/image (정적 자산)
     * - api/* (자체적으로 인증 처리, 매 요청 Supabase 호출 불필요)
     * - favicon.ico
     * - 이미지·CSS·JS 파일들
     */
    "/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
