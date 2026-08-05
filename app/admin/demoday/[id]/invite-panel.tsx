"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, AlertTriangle, Check, Search } from "lucide-react";
import type { Reviewer } from "@/lib/demoday/types";

type ConflictItem = {
  companyId: number;
  companyName: string;
  roundTitle: string;
  roundDate: string;
  source: "submission" | "invite";
};

type Props = {
  roundId: string;
  companyIds: number[];
  currentInvitedIds: string[];
};

export function InvitePanel({ roundId, companyIds, currentInvitedIds }: Props) {
  const router = useRouter();
  const [allReviewers, setAllReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<Record<string, ConflictItem[]>>({});
  const [conflictLoading, setConflictLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/demoday/reviewers")
      .then((r) => r.json())
      .then((d: Reviewer[] | { error: string }) => {
        if (Array.isArray(d)) setAllReviewers(d);
      })
      .catch(() => {
        setError("심사역 목록을 불러오지 못했습니다");
      })
      .finally(() => setLoading(false));
  }, []);

  const availableReviewers = useMemo(() => {
    const invitedSet = new Set(currentInvitedIds);
    return allReviewers
      .filter((r) => !invitedSet.has(r.id))
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.organization.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
        );
      });
  }, [allReviewers, currentInvitedIds, search]);

  const toggle = async (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    if (next.size > 0 && companyIds.length > 0) {
      setConflictLoading(true);
      try {
        const params = new URLSearchParams({
          reviewerIds: Array.from(next).join(","),
          companyIds: companyIds.join(","),
        });
        const res = await fetch(`/api/admin/demoday/conflicts?${params}`);
        const j = (await res.json()) as Record<string, ConflictItem[]>;
        setConflicts(j);
      } catch {
        /* ignore */
      } finally {
        setConflictLoading(false);
      }
    } else {
      setConflicts({});
    }
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/demoday/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roundId, reviewerIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "초청 실패");
      }
      setSelected(new Set());
      setConflicts({});
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "초청 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="text-[13px] font-semibold text-zinc-900 mb-3">심사역 초청</div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름·소속·이메일 검색"
          className="w-full h-9 pl-8 pr-3 rounded-lg border border-zinc-200 text-[12.5px] focus:outline-none focus:border-brand"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 mb-3">
        {loading ? (
          <div className="py-4 text-center text-[12px] text-zinc-500">불러오는 중...</div>
        ) : availableReviewers.length === 0 ? (
          <div className="py-4 text-center text-[12px] text-zinc-500">
            {search ? "검색 결과 없음" : "초청 가능한 심사역이 없습니다"}
          </div>
        ) : (
          availableReviewers.map((r) => {
            const on = selected.has(r.id);
            const conf = conflicts[r.id] ?? [];
            return (
              <label
                key={r.id}
                className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                  on ? "bg-brand/5 border border-brand/30" : "hover:bg-zinc-50 border border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(r.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium text-zinc-900">
                    {r.name}
                    <span className="text-[11px] text-zinc-500 ml-1.5">
                      {r.organization}
                      {r.role ? ` · ${r.role}` : ""}
                    </span>
                  </div>
                  {conf.length > 0 ? (
                    <div className="mt-1 text-[11px] text-amber-700 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>
                        과거 이력: {conf.map((c) => `${c.companyName}(${c.roundDate})`).join(", ")}
                      </span>
                    </div>
                  ) : null}
                </div>
              </label>
            );
          })
        )}
      </div>

      {error ? (
        <div className="mb-2 text-[11.5px] text-rose-700">{error}</div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="text-[11.5px] text-zinc-500">
          {selected.size > 0 ? `${selected.size}명 선택됨` : "심사역을 선택하세요"}
          {conflictLoading ? " · 이력 확인 중..." : ""}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={selected.size === 0 || submitting}
          className="h-9 px-4 rounded-lg bg-brand text-white text-[12.5px] font-semibold hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          초청 링크 발급
        </button>
      </div>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
      title="링크 복사"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
      {copied ? "복사됨" : "링크 복사"}
    </button>
  );
}
