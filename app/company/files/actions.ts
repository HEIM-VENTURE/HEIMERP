"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 포털 다운로드용 서명 URL.
 * 클라이언트가 보낸 경로는 믿지 않고, fileId 로 files 행을 RLS 클라이언트로 조회해
 * (= 이 사용자가 볼 수 있는 파일인지 DB 가 판단) 그 행의 경로로만 URL 을 만든다.
 */
export async function getPortalFileSignedUrl(
  fileId: number,
): Promise<{ error?: string; signedUrl?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.company_id || profile.role !== "company_member") {
    return { error: "회사 연결 없음" };
  }

  const { data: file } = await supabase
    .from("files")
    .select("url, company_id")
    .eq("id", fileId)
    .maybeSingle();
  if (!file || file.company_id !== profile.company_id) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  // 경로 이중 확인 (자기 회사 폴더 · 상위 경로 이동 금지)
  const path = String(file.url);
  if (!path.startsWith(`${profile.company_id}/`) || path.split("/").includes("..")) {
    return { error: "접근 권한 없음" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("company-files")
    .createSignedUrl(path, 60 * 10);
  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl };
}
