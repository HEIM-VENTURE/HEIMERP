"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

type Program = "TIPS" | "LIPS";

export type MatchedCompany = {
  id: number;
  name: string;
  valuation: number | null; // 백만원
  investment: number | null; // 백만원
  program: Program;
};

function fmtEok(mil: number | null): string | null {
  if (mil == null) return null;
  const e = mil / 100;
  return Number.isInteger(e) ? `${e}억` : `${e.toFixed(1).replace(/\.0$/, "")}억`;
}

export function MatchedCompanies({ items }: { items: MatchedCompany[] }) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) {
    return <span className="text-xs text-zinc-300">—</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
      >
        <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700">
          {items.length}곳 매칭
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </button>

      {open ? (
        <ul className="space-y-1.5 list-none mt-2">
          {items.map((c) => {
            const val = fmtEok(c.valuation);
            const inv = fmtEok(c.investment);
            const cond =
              val && inv
                ? `${val} 밸류 / ${inv} 투자`
                : val
                  ? `${val} 밸류`
                  : inv
                    ? `${inv} 투자`
                    : "";
            return (
              <li
                key={`${c.id}-${c.program}`}
                className="text-xs flex items-baseline gap-1.5"
              >
                <span className="text-zinc-300 select-none shrink-0">·</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={
                        "inline-block whitespace-nowrap px-1.5 py-0.5 text-[10px] font-medium rounded shrink-0 " +
                        (c.program === "LIPS"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-brand/10 text-brand")
                      }
                    >
                      {c.program}
                    </span>
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="text-zinc-800 hover:text-brand hover:underline font-medium"
                    >
                      {c.name}
                    </Link>
                  </div>
                  {cond ? (
                    <div className="text-[11px] text-zinc-500 whitespace-nowrap mt-0.5">
                      {cond}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
