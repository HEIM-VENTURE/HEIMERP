"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { error?: string; success?: boolean; path?: string; signedUploadUrl?: string; token?: string };

/** 포털용 서명 업로드 URL 발급 (service role 로 Storage RLS bypass) */
export async function createPortalSignedUpload(
  filename: string,
  size: number,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.company_id || profile.role !== "company_member") {
    return { error: "회사가 연결되어 있지 않습니다." };
  }
  if (size > 104857600) return { error: "파일이 너무 큽니다 (최대 100MB)" };

  // Storage key 는 ASCII 만 허용 — 한글 파일명은 timestamp + 확장자로 저장.
  // 원본 파일명은 files.filename 컬럼에 그대로 보존.
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
  const path = `${profile.company_id}/portal/${Date.now()}${safeExt}`;

  // service role 로 서명 URL 생성 (Storage RLS 우회)
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("company-files")
    .createSignedUploadUrl(path);
  if (error) return { error: error.message };

  return { success: true, path, signedUploadUrl: data.signedUrl, token: data.token };
}

/** 업로드 완료 후 files 테이블 insert (service role 로 RLS bypass + 권한은 서버 액션 내 체크) */
export async function recordPortalFile(input: {
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  kind: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.company_id || profile.role !== "company_member") {
    return { error: "회사가 연결되어 있지 않습니다." };
  }

  // 경로가 자기 회사 폴더로 시작하는지 재확인 (보안)
  if (!input.path.startsWith(`${profile.company_id}/`)) {
    return { error: "경로 검증 실패" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("files").insert({
    company_id: profile.company_id,
    uploader_id: user.id,
    kind: input.kind,
    path: input.path,
    filename: input.filename,
    size: input.size,
    mime_type: input.mimeType,
    source: "company",
  });
  if (error) return { error: error.message };

  revalidatePath("/company/files");
  revalidatePath(`/admin/companies/${profile.company_id}`);
  return { success: true };
}

/** 다운로드용 서명 URL (service role 로 bypass) */
export async function getPortalFileSignedUrl(
  path: string,
): Promise<ActionResult & { signedUrl?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.company_id) return { error: "회사 연결 없음" };

  // path 가 자기 회사 폴더로 시작하는지 재확인
  if (!path.startsWith(`${profile.company_id}/`)) {
    return { error: "접근 권한 없음" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("company-files")
    .createSignedUrl(path, 60 * 10);
  if (error) return { error: error.message };
  return { success: true, signedUrl: data.signedUrl };
}

/** 본인이 올린 파일만 삭제 가능 (admin이 올린 건 보호됨 by RLS) */
export async function deletePortalFile(fileId: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: file } = await supabase
    .from("files")
    .select("id, path, company_id, uploader_id")
    .eq("id", fileId)
    .maybeSingle();
  if (!file) return { error: "파일을 찾을 수 없습니다." };
  if (file.uploader_id !== user.id) {
    return { error: "본인이 올린 파일만 삭제할 수 있습니다." };
  }

  const admin = createAdminClient();
  // Storage 삭제
  await admin.storage.from("company-files").remove([file.path]);
  // files 테이블 삭제
  const { error } = await admin.from("files").delete().eq("id", fileId);
  if (error) return { error: error.message };

  revalidatePath("/company/files");
  revalidatePath(`/admin/companies/${file.company_id}`);
  return { success: true };
}
