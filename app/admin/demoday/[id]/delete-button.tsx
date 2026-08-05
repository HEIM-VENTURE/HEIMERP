"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteRoundButton({
  roundId,
  roundTitle,
}: {
  roundId: string;
  roundTitle: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `"${roundTitle}" 회차를 정말 삭제하시겠어요?\n\n` +
        `참여 스타트업·심사역 초청·제출된 평가가 모두 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/demoday/rounds/${roundId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "삭제 실패");
      }
      router.push("/admin/demoday");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "삭제 실패";
      alert(msg);
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center gap-1.5 text-[12px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-md border border-transparent hover:border-rose-200 transition-colors disabled:opacity-50"
      title="이 회차 삭제 (되돌릴 수 없음)"
    >
      {deleting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      회차 삭제
    </button>
  );
}
