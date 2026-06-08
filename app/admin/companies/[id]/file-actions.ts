"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { error?: string; success?: boolean };

const BUCKET = "company-files";

/**
 * 현재 사용자가 해당 기업에 접근 가능한지 검증.
 * admin = 전체, hvp = 본인 데려온 기업만.
 */
async function authorizeCompany(companyId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" as const, userId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, hvp_id")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") return { error: null, userId: user.id };

  if (profile?.role === "hvp") {
    const { data: company } = await supabase
      .from("companies")
      .select("hvp_id")
      .eq("id", companyId)
      .single();
    if (company?.hvp_id && company.hvp_id === profile.hvp_id) {
      return { error: null, userId: user.id };
    }
  }

  return { error: "권한 없음" as const, userId: null };
}

/**
 * 1단계: 클라이언트에서 Supabase Storage 로 직접 PUT 할 수 있는 signed URL 생성.
 * Vercel Server Action body limit(~4.5MB) 우회 — 큰 파일도 50MB까지 가능.
 */
export async function createUploadUrlAction(
  companyId: number,
  filename: string
): Promise<{ error?: string; path?: string; signedUrl?: string; token?: string }> {
  const { error: authError } = await authorizeCompany(companyId);
  if (authError) return { error: authError };

  if (!filename) return { error: "파일명 누락" };

  // 경로: {companyId}/{timestamp}-{ASCII만 정리된 파일명}.{ext}
  const ext = filename.match(/\.[a-zA-Z0-9]+$/)?.[0]?.toLowerCase() ?? "";
  const slug =
    filename
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || "file";
  const path = `${companyId}/${Date.now()}-${slug}${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error) return { error: "업로드 URL 생성 실패: " + error.message };
  return { path: data.path, signedUrl: data.signedUrl, token: data.token };
}

/**
 * 2단계: 클라이언트가 Storage 업로드 완료 후 호출 — files 테이블에 메타만 INSERT (작은 페이로드).
 */
export async function recordCompanyFileAction(
  companyId: number,
  path: string,
  filename: string,
  kind: string,
  size: number
): Promise<ActionResult> {
  const { error: authError, userId } = await authorizeCompany(companyId);
  if (authError) return { error: authError };

  if (!path || !filename) return { error: "경로/파일명 누락" };
  if (size > 52428800) return { error: "파일이 너무 큽니다 (최대 50MB)" };

  const admin = createAdminClient();

  // 파일이 실제 업로드됐는지 확인 (보안 — 누군가 임의 경로 INSERT 못하게)
  const folder = path.split("/")[0];
  if (folder !== String(companyId)) return { error: "경로 검증 실패" };

  const { error: insertError } = await admin.from("files").insert({
    company_id: companyId,
    filename,
    url: path,
    kind: kind || "other",
    size_bytes: size,
    uploader_id: userId,
  });

  if (insertError) {
    // 메타 실패 시 업로드한 파일 정리
    await admin.storage.from(BUCKET).remove([path]);
    return { error: "메타 저장 실패: " + insertError.message };
  }

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/hvp/companies/${companyId}`);
  return { success: true };
}

export async function deleteCompanyFileAction(
  fileId: number,
  companyId: number
): Promise<ActionResult> {
  const { error: authError } = await authorizeCompany(companyId);
  if (authError) return { error: authError };

  const admin = createAdminClient();

  const { data: row } = await admin
    .from("files")
    .select("url")
    .eq("id", fileId)
    .single();

  if (row?.url) {
    await admin.storage.from(BUCKET).remove([row.url]);
  }

  const { error } = await admin.from("files").delete().eq("id", fileId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/hvp/companies/${companyId}`);
  return { success: true };
}

/**
 * 다운로드용 signed URL 생성 (유효시간 1시간).
 */
export async function getFileSignedUrlAction(
  filePath: string,
  companyId: number
): Promise<{ url?: string; error?: string }> {
  const { error: authError } = await authorizeCompany(companyId);
  if (authError) return { error: authError };

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
