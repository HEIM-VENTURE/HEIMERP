"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Download, FileText, Building2 } from "lucide-react";
import {
  createPortalSignedUpload,
  recordPortalFile,
  getPortalFileSignedUrl,
  deletePortalFile,
} from "./actions";

export type PortalFile = {
  id: number;
  kind: string;
  path: string;
  filename: string;
  size: number;
  mime_type: string | null;
  source: string | null;
  uploader_id: string | null;
  created_at: string;
};

const KIND_OPTIONS = [
  { value: "tax_invoice", label: "세금계산서" },
  { value: "contract", label: "계약서" },
  { value: "business_cert", label: "사업자등록증" },
  { value: "ir_deck", label: "IR Deck" },
  { value: "financial", label: "재무제표" },
  { value: "corp_registry", label: "법인등기부등본" },
  { value: "general", label: "기타" },
];

const KIND_LABEL: Record<string, string> = KIND_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {},
);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function PortalFileManager({
  currentUserId,
  files,
}: {
  currentUserId: string;
  files: PortalFile[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<string>("tax_invoice");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      // 1) 서명 업로드 URL
      const signRes = await createPortalSignedUpload(file.name, file.size);
      if (signRes.error || !signRes.path || !signRes.token) {
        setError(signRes.error || "업로드 URL 발급 실패");
        return;
      }

      // 2) Storage 에 PUT (Supabase 토큰 방식)
      const { createClient } = await import("@supabase/supabase-js");
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const client = createClient(supaUrl, supaKey);
      const { error: upErr } = await client.storage
        .from("company-files")
        .uploadToSignedUrl(signRes.path, signRes.token, file);
      if (upErr) {
        setError(upErr.message);
        return;
      }

      // 3) files 테이블 insert
      const recRes = await recordPortalFile({
        path: signRes.path,
        filename: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        kind,
      });
      if (recRes.error) {
        setError(recRes.error);
        return;
      }

      router.refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDownload = (path: string) => {
    start(async () => {
      const res = await getPortalFileSignedUrl(path);
      if (res.error || !res.signedUrl) {
        alert(res.error || "다운로드 실패");
        return;
      }
      window.open(res.signedUrl, "_blank");
    });
  };

  const onDelete = (id: number, name: string) => {
    if (!confirm(`"${name}" 파일을 삭제하시겠습니까?`)) return;
    start(async () => {
      const res = await deletePortalFile(id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      {/* 업로드 영역 */}
      <div className="bg-white border-2 border-dashed border-zinc-300 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            disabled={uploading}
            className="h-10 px-3 rounded-md border border-zinc-300 text-[13px] bg-white cursor-pointer"
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
            disabled={uploading}
            className="hidden"
            id="portal-file-input"
          />
          <label
            htmlFor="portal-file-input"
            className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-brand text-white text-[13px] font-medium hover:opacity-90 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "업로드 중..." : "파일 선택"}
          </label>
          <span className="text-[11.5px] text-zinc-500">
            최대 100MB · PDF·이미지·엑셀·워드 등
          </span>
        </div>
        {error ? <div className="text-[12px] text-rose-600 mt-2">{error}</div> : null}
      </div>

      {/* 파일 리스트 */}
      {files.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl py-12 text-center text-sm text-zinc-400">
          아직 파일이 없습니다
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {files.map((f) => {
            const isMine = f.uploader_id === currentUserId;
            const isAdminFile = f.source === "admin" || !isMine;
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 hover:bg-zinc-50/60">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-zinc-900 truncate">
                      {f.filename}
                    </span>
                    <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                      {KIND_LABEL[f.kind] ?? f.kind}
                    </span>
                    {isAdminFile ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"
                        title="하임 담당자가 업로드"
                      >
                        <Building2 className="w-2.5 h-2.5" /> 하임 공유
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        내가 업로드
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {formatSize(f.size)} · {new Date(f.created_at).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDownload(f.path)}
                    disabled={pending}
                    className="p-2 rounded hover:bg-white text-zinc-500 hover:text-brand"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {isMine ? (
                    <button
                      type="button"
                      onClick={() => onDelete(f.id, f.filename)}
                      disabled={pending}
                      className="p-2 rounded hover:bg-white text-zinc-400 hover:text-rose-600"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
