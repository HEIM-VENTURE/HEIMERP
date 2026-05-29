"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  column: string;
  label: string;
  align?: "left" | "right";
};

export function SortableHeader({ column, label, align = "left" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeSort = params.get("sort");
  const dir = params.get("dir") === "desc" ? "desc" : "asc";
  const isActive = activeSort === column;

  const onClick = () => {
    const next = new URLSearchParams(params.toString());
    if (isActive) {
      // 같은 컬럼 재클릭 → 방향 토글, 오름차순 상태에서 또 누르면 정렬 해제
      if (dir === "asc") {
        next.set("sort", column);
        next.set("dir", "desc");
      } else {
        next.delete("sort");
        next.delete("dir");
      }
    } else {
      next.set("sort", column);
      next.set("dir", "asc");
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "group inline-flex items-center gap-1 font-medium transition-colors hover:text-zinc-900",
        isActive ? "text-zinc-900" : "text-zinc-500",
        align === "right" && "flex-row-reverse"
      )}
    >
      <span>{label}</span>
      {isActive ? (
        dir === "asc" ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )
      ) : (
        <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-400" />
      )}
    </button>
  );
}
