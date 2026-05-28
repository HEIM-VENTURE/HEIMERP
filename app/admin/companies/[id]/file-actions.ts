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

export async function uploadCompanyFileAction(
  companyId: number,
  formData: FormData
): Promise<ActionResult> {
  const { error: authError, userId } = await authorizeCompany(companyId);
  if (authError) return { error: authError };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "파일을 선택하세요" };
  }
  if (file.size > 52428800) {
    return { error: "파일이 너무 큽니다 (최대 50MB)" };
  }

  const kindRaw = String(formData.get("kind") ?? "other").trim();
  const kind = kindRaw || "other";

  // 경로: {companyId}/{timestamp}-{원본명}  (한글·공백 정리)
  const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_");
  const path = `${companyId}/${Date.now()}-${safeName}`;

  const admin = createAdminClient();

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) return { error: "업로드 실패: " + uploadError.message };

  // files 테이블에 메타 기록 (url 컬럼엔 버킷 내 경로 저장)
  const { error: insertError } = await admin.from("files").insert({
    company_id: companyId,
    filename: file.name,
    url: path,
    kind,
    size_bytes: file.size,
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
