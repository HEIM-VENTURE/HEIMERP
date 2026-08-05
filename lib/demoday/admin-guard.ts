/**
 * 관리자 API 라우트에서 사용할 인증 가드.
 * 세션에서 Supabase user 를 가져와 profiles.role === 'admin' 검증.
 */

import { createClient } from "@/lib/supabase/server";

export type AdminGuardResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "로그인이 필요합니다" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, error: "관리자 권한 필요" };
  }
  return { ok: true, userId: user.id };
}
