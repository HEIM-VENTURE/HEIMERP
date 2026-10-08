"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listDriveFolders } from "@/lib/google-drive";

/** 공백·괄호·특수문자 제거 후 소문자 변환 (매칭용 정규화) */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）\-·.,\\/]/g, "")
    .replace(/^(주식회사|㈜|㈐|주)/g, "")
    .trim();
}

export type DriveSyncResult = {
  error?: string;
  totalFolders?: number;
  totalCompanies?: number;
  autoLinked?: number;
  linkedCompanies?: { id: number; name: string; folderUrl: string }[];
  // 매칭 안된 것들 (사용자 수동 처리용)
  unmatchedFolders?: { name: string; url: string }[];
  companiesWithoutFolder?: { id: number; name: string }[];
};

/**
 * Drive 폴더 ↔ ERP 기업 자동 매칭.
 * - companies.drive_folder_url 이 비어있는 기업만 대상
 * - 정규화 매칭 (공백·괄호·'주식회사' 제거 후 소문자)
 * - 매칭되면 drive_folder_url + drive_folder_id 자동 저장
 */
export async function syncDriveWithCompanies(): Promise<DriveSyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { error: "관리자 권한 필요" };

  const listRes = await listDriveFolders();
  if (!listRes.ok) return { error: `Drive 조회 실패: ${listRes.error}` };
  const folders = listRes.folders;

  const { data: companies, error: compErr } = await supabase
    .from("companies")
    .select("id, name, drive_folder_url")
    .is("drop_reason", null);
  if (compErr) return { error: compErr.message };

  const folderMap = new Map<string, { name: string; id: string; url: string }>();
  for (const f of folders) folderMap.set(normalize(f.name), f);

  const linkedCompanies: { id: number; name: string; folderUrl: string }[] = [];
  const companiesWithoutFolder: { id: number; name: string }[] = [];
  const matchedFolderKeys = new Set<string>();

  for (const c of companies ?? []) {
    if (c.drive_folder_url) {
      // 이미 연결됨 → 어떤 폴더랑 매칭됐는지만 체크
      const key = normalize(c.name);
      if (folderMap.has(key)) matchedFolderKeys.add(key);
      continue;
    }
    const key = normalize(c.name);
    const match = folderMap.get(key);
    if (match) {
      const { error: updErr } = await supabase
        .from("companies")
        .update({ drive_folder_url: match.url, drive_folder_id: match.id })
        .eq("id", c.id);
      if (!updErr) {
        linkedCompanies.push({ id: c.id, name: c.name, folderUrl: match.url });
        matchedFolderKeys.add(key);
      }
    } else {
      companiesWithoutFolder.push({ id: c.id, name: c.name });
    }
  }

  const unmatchedFolders = folders
    .filter((f) => !matchedFolderKeys.has(normalize(f.name)))
    .map((f) => ({ name: f.name, url: f.url }));

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");

  return {
    totalFolders: folders.length,
    totalCompanies: companies?.length ?? 0,
    autoLinked: linkedCompanies.length,
    linkedCompanies,
    unmatchedFolders,
    companiesWithoutFolder,
  };
}
