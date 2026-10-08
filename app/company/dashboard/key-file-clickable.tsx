"use client";

import { useTransition } from "react";
import { FileText, Download } from "lucide-react";
import { getPortalFileSignedUrl } from "../files/actions";

export function KeyFileClickable({
  label,
  filename,
  path,
  createdAt,
}: {
  label: string;
  fileId: number;
  filename: string;
  path: string;
  createdAt: string;
}) {
  const [pending, start] = useTransition();

  const open = () => {
    start(async () => {
      const res = await getPortalFileSignedUrl(path);
      if (res.error || !res.signedUrl) {
        alert(res.error || "다운로드 실패");
        return;
      }
      window.open(res.signedUrl, "_blank");
    });
  };

  const relative = (() => {
    const d = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
    if (d === 0) return "오늘";
    if (d < 7) return `${d}일 전`;
    if (d < 30) return `${Math.floor(d / 7)}주 전`;
    return `${Math.floor(d / 30)}개월 전`;
  })();

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending}
      className="group text-left p-3 rounded-lg bg-brand/5 border border-brand/20 hover:bg-brand/10 transition-colors disabled:opacity-60"
    >
      <div className="text-[11.5px] font-semibold text-brand mb-1 flex items-center justify-between">
        <span>{label}</span>
        <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-zinc-900 truncate">
            {pending ? "다운로드 중..." : filename}
          </div>
          <div className="text-[10.5px] text-zinc-500 mt-0.5">업로드 {relative}</div>
        </div>
      </div>
    </button>
  );
}
