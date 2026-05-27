"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 로그인 server action.
 * 성공 시 profile.role에 따라 적절한 대시보드로 리다이렉트.
 * 실패 시 ?error= 쿼리로 다시 / 로 돌아옴.
 */
export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/?error=" + encodeURIComponent("이메일과 비밀번호를 입력하세요"));
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.user) {
    redirect("/?error=" + encodeURIComponent(signInError?.message ?? "로그인 실패"));
  }

  // 역할 조회
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", signInData.user.id)
    .single();

  // ⚠️ 디버그용: 실제 원인 파악 후 제거 예정
  console.log("🔍 [loginAction] user.id:", signInData.user.id);
  console.log("🔍 [loginAction] user.email:", signInData.user.email);
  console.log("🔍 [loginAction] profile:", profile);
  console.log("🔍 [loginAction] profileError:", profileError);

  if (!profile) {
    redirect(
      "/?error=" +
        encodeURIComponent(
          `profile not found - uid=${signInData.user.id} email=${signInData.user.email} err=${profileError?.message ?? "none"}`
        )
    );
  }

  revalidatePath("/", "layout");

  if (profile.role === "admin") redirect("/admin/dashboard");
  if (profile.role === "hvp") redirect("/hvp/dashboard");
  redirect(
    "/company/dashboard?debug=" +
      encodeURIComponent(`role=${profile.role} email=${profile.email}`)
  );
}

/**
 * 로그아웃 server action.
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Google OAuth 로그인 시작 (server action).
 * client보다 안정적 — PKCE verifier가 cookie에 저장됨.
 */
export async function signInWithGoogleAction() {
  const supabase = await createClient();

  // request headers에서 origin 추출
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/?error=${encodeURIComponent("Google 로그인 시작 실패: " + error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect(`/?error=${encodeURIComponent("OAuth URL 생성 실패")}`);
}
