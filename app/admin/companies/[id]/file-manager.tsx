"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FILE_KIND_LABELS } from "@/lib/labels";
import {
  uploadCompanyFileAction,
  deleteCompanyFileAction,
  getFileSignedUrlAction,
} from "./file-actions";

type FileRow = {
  id: number;
  filename: string;
  url: string; // 버킷 내 경로
  kind: string;
  size_bytes: number | null;
  created_at: string;
};

const KIND_OPTIONS = Object.entries(FILE_KIND_LABELS) as [string, string][];

export function FileManager({
  companyId,
  files,
}: {
  companyId: number;
  files: FileRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await uploadCompanyFileAction(companyId, formData);
      if (result.error) setError(result.error);
      else {
        formRef.current?.reset();
        setFileName("");
      }
    });
  };

  const onDownload = (file: FileRow) => {
    setDownloadingId(file.id);
    startTransition(async () => {
      const result = await getFileSignedUrlAction(file.url, companyId);
      setDownloadingId(null);
      if (result.error) setError(result.error);
      else if (result.url) window.open(result.url, "_blank");
    });
  };

  const onDelete = (file: FileRow) => {
    setConfirmingDeleteId(null);
    startTransition(async () => {
      const result = await deleteCompanyFileAction(file.id, companyId);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900">자료</h3>
        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
          {files.length}
        </span>
      </div>

      {/* 업로드 폼 */}
      <form ref={formRef} action={onSubmit} className="space-y-2 mb-4 p-3 bg-zinc-50 rounded-lg">
        <div className="flex gap-2">
          <select
            name="kind"
            defaultValue="business_plan"
            className="text-xs border border-zinc-200 rounded-md px-2 py-1.5 bg-white"
          >
            {KIND_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 text-xs text-left border border-zinc-200 rounded-md px-2 py-1.5 bg-white text-zinc-500 truncate hover:bg-zinc-50"
          >
            {fileName || "파일 선택…"}
          </button>
        </div>
        {error ? (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-1.5">
            {error}
          </div>
        ) : null}
        <Button type="submit" disabled={pending || !fileName} className="w-full text-xs h-8">
          {pending ? "업로드 중..." : "+ 자료 업로드"}
        </Button>
      </form>

      {/* 파일 목록 */}
      {files.length === 0 ? (
        <div className="text-xs text-zinc-400 text-center py-3">업로드된 자료 없음</div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-start gap-2 text-xs group">
              <span className="text-sky-500 mt-0.5">📎</span>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onDownload(f)}
                  disabled={downloadingId === f.id}
                  className="text-zinc-700 hover:text-zinc-900 hover:underline text-left truncate block w-full"
                  title={f.filename}
                >
                  {downloadingId === f.id ? "여는 중..." : f.filename}
                </button>
                <div className="text-zinc-400">
                  {FILE_KIND_LABELS[f.kind as keyof typeof FILE_KIND_LABELS] ?? "기타"}
                  {f.size_bytes ? ` · ${formatSize(f.size_bytes)}` : ""}
                </div>
              </div>
              {confirmingDeleteId === f.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onDelete(f)}
                    disabled={pending}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 hover:bg-rose-200"
                  >
                    정말 삭제
                  </button>
                  <button
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-900"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDeleteId(f.id)}
                  className="text-zinc-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                  title="삭제"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
