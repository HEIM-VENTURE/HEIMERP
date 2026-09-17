"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { TappingPanel, type TappingEvent } from "./tapping-events-panel";

/**
 * 칸반 카드 하단 얇은 편집 링크. 클릭 → 우측 사이드패널 오픈.
 * 최근 상태는 위 이력 리스트에 이미 있으므로 여기선 액션 문구만.
 */
export function EditLink({
  tappingId,
  companyName,
  events,
}: {
  tappingId: string;
  companyName: string;
  events: TappingEvent[];
}) {
  const [open, setOpen] = useState(false);
  const label = events.length === 0 ? "태핑 추가" : "태핑 추가 · 편집";
  const Icon = events.length === 0 ? Plus : Pencil;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center gap-1 py-0.5 text-[10.5px] text-zinc-400 hover:text-brand transition-colors"
      >
        <Icon className="w-2.5 h-2.5" />
        {label}
      </button>
      {open ? (
        <TappingPanel
          tappingId={tappingId}
          companyName={companyName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
