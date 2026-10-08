import { createClient } from "@/lib/supabase/server";
import { FolderOpen } from "lucide-react";
import { PortalFileManager, type PortalFile } from "./portal-file-manager";

export const dynamic = "force-dynamic";

export default async function CompanyFilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id;

  if (!companyId) {
    return (
      <div className="max-w-2xl bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
        회사 연결이 아직 되지 않았습니다. 담당자에게 문의해주세요.
      </div>
    );
  }

  const [{ data: company }, { data: files }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", companyId).single(),
    supabase
      .from("files")
      .select("id, kind, path, filename, size, mime_type, source, uploader_id, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ]);

  const list = (files ?? []) as PortalFile[];

  return (
    <div className="max-w-4xl">
      <h1 className="text-[22px] font-bold text-zinc-900 flex items-center gap-2 mb-1">
        <FolderOpen className="w-5 h-5 text-brand" />
        내 자료
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        <b>{company?.name}</b> · 세금계산서·계약서·IR Deck 등을 업로드하면 하임 담당자가 바로 확인할 수 있습니다.
      </p>

      <PortalFileManager currentUserId={profile.id} files={list} />
    </div>
  );
}
