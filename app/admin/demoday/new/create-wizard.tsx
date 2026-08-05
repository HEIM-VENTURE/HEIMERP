"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Reviewer } from "@/lib/demoday/types";

type CompanyRow = {
  id: number;
  name: string;
  ceo_name: string | null;
  main_item: string | null;
  sales_stage: string | null;
  consulting_stage: string | null;
};

type SelectedStartup = {
  companyId: number;
  companyName: string;
  session: string;
  pitchOrder: string;
  pitchTime: string;
};

type ConflictItem = {
  companyId: number;
  companyName: string;
  roundTitle: string;
  roundDate: string;
  source: "submission" | "invite";
};

function isoWeekCode(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  // ISO week number
  const target = new Date(Date.UTC(year, d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `DD-${year}-W${String(week).padStart(2, "0")}`;
}

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: round info
  const [date, setDate] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [timeRange, setTimeRange] = useState("14:00 - 16:00");
  const [zoomUrl, setZoomUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!codeTouched && date) setCode(isoWeekCode(date));
  }, [date, codeTouched]);

  // Step 2: startups
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [startups, setStartups] = useState<SelectedStartup[]>([]);

  useEffect(() => {
    if (step !== 2) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      setCompaniesLoading(true);
      fetch(`/api/admin/demoday/companies?search=${encodeURIComponent(search)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((d: CompanyRow[] | { error: string }) => {
          if (Array.isArray(d)) setCompanies(d);
        })
        .catch(() => {
          /* ignore */
        })
        .finally(() => setCompaniesLoading(false));
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [search, step]);

  const startupCompanyIds = useMemo(() => startups.map((s) => s.companyId), [startups]);

  const addStartup = (c: CompanyRow) => {
    if (startupCompanyIds.includes(c.id)) return;
    setStartups((cur) => [
      ...cur,
      {
        companyId: c.id,
        companyName: c.name,
        session: "",
        pitchOrder: String(cur.length + 1),
        pitchTime: "",
      },
    ]);
  };

  const updateStartup = (idx: number, patch: Partial<SelectedStartup>) => {
    setStartups((cur) => cur.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeStartup = (idx: number) => {
    setStartups((cur) => cur.filter((_, i) => i !== idx));
  };

  // Step 3: reviewers
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewersLoading, setReviewersLoading] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<Set<string>>(new Set());
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [conflicts, setConflicts] = useState<Record<string, ConflictItem[]>>({});
  const [conflictLoading, setConflictLoading] = useState(false);

  useEffect(() => {
    if (step !== 3) return;
    setReviewersLoading(true);
    fetch("/api/admin/demoday/reviewers")
      .then((r) => r.json())
      .then((d: Reviewer[] | { error: string }) => {
        if (Array.isArray(d)) setReviewers(d);
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => setReviewersLoading(false));
  }, [step]);

  const filteredReviewers = useMemo(() => {
    if (!reviewerSearch) return reviewers;
    const q = reviewerSearch.toLowerCase();
    return reviewers.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.organization.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [reviewers, reviewerSearch]);

  const toggleReviewer = async (id: string) => {
    const next = new Set(selectedReviewers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedReviewers(next);
    if (next.size > 0 && startupCompanyIds.length > 0) {
      setConflictLoading(true);
      try {
        const params = new URLSearchParams({
          reviewerIds: Array.from(next).join(","),
          companyIds: startupCompanyIds.join(","),
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

  // Final submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step1Valid = code.trim() && title.trim() && date.trim();

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // 1. create round
      const roundRes = await fetch("/api/admin/demoday/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          title: title.trim(),
          date: date.trim(),
          timeRange: timeRange.trim() || null,
          zoomUrl: zoomUrl.trim() || null,
          notes: notes.trim() || null,
          status: "scheduled",
        }),
      });
      if (!roundRes.ok) {
        const j = (await roundRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "회차 생성 실패");
      }
      const round = (await roundRes.json()) as { id: string };

      // 2. add startups
      for (const s of startups) {
        const res = await fetch("/api/admin/demoday/startups", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            roundId: round.id,
            companyId: s.companyId,
            session: s.session.trim() || null,
            pitchOrder: s.pitchOrder ? Number(s.pitchOrder) : null,
            pitchTime: s.pitchTime.trim() || null,
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "참여 기업 추가 실패");
        }
      }

      // 3. invite reviewers
      if (selectedReviewers.size > 0) {
        const res = await fetch("/api/admin/demoday/tokens", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            roundId: round.id,
            reviewerIds: Array.from(selectedReviewers),
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "심사역 초청 실패");
        }
      }

      router.push(`/admin/demoday/${round.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                step === n
                  ? "bg-brand text-white"
                  : step > n
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {step > n ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            <div
              className={`text-[12.5px] ${
                step >= n ? "font-semibold text-zinc-900" : "text-zinc-500"
              }`}
            >
              {n === 1 ? "회차 정보" : n === 2 ? "참여 스타트업" : "심사역 초청"}
            </div>
            {i < 2 ? <ChevronRight className="w-3.5 h-3.5 text-zinc-300 mx-1" /> : null}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="회차 일자" required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-[13px] focus:outline-none focus:border-brand"
              />
            </Field>
            <Field label="회차 코드" required>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeTouched(true);
                }}
                placeholder="DD-2026-W33"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-[13px] font-mono focus:outline-none focus:border-brand"
              />
            </Field>
          </div>
          <Field label="회차 제목" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 8월 3주차 데모데이"
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-[13px] focus:outline-none focus:border-brand"
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="시간대">
              <input
                type="text"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                placeholder="14:00 - 16:00"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-[13px] focus:outline-none focus:border-brand"
              />
            </Field>
            <Field label="Zoom 링크">
              <input
                type="url"
                value={zoomUrl}
                onChange={(e) => setZoomUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-[13px] focus:outline-none focus:border-brand"
              />
            </Field>
          </div>
          <Field label="운영 메모">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="심사역 태핑 전략, 사전 특이사항 등"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] focus:outline-none focus:border-brand resize-none"
            />
          </Field>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="h-10 px-4 rounded-lg bg-brand text-white text-[13px] font-semibold hover:bg-brand/90 disabled:opacity-40"
            >
              다음: 스타트업 선택 →
            </button>
          </div>
        </div>
      ) : null}

      {/* Step 2 */}
      {step === 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Search companies */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="text-[13px] font-semibold text-zinc-900 mb-3">회사 검색</div>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="회사명 검색"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-zinc-200 text-[12.5px] focus:outline-none focus:border-brand"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {companiesLoading ? (
                <div className="py-4 text-center text-[12px] text-zinc-500">불러오는 중...</div>
              ) : companies.length === 0 ? (
                <div className="py-4 text-center text-[12px] text-zinc-500">
                  결과 없음
                </div>
              ) : (
                companies.map((c) => {
                  const added = startupCompanyIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => addStartup(c)}
                      disabled={added}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-zinc-900">
                          {c.name}
                          {c.ceo_name ? (
                            <span className="text-[11px] text-zinc-500 ml-1.5">
                              대표 {c.ceo_name}
                            </span>
                          ) : null}
                        </div>
                        {c.main_item ? (
                          <div className="text-[11px] text-zinc-500 truncate">
                            {c.main_item}
                          </div>
                        ) : null}
                      </div>
                      {added ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="text-[13px] font-semibold text-zinc-900 mb-3">
              선택된 참여 기업 · {startups.length}곳
            </div>
            {startups.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-zinc-500">
                왼쪽에서 회사를 선택해 주세요.
              </div>
            ) : (
              <div className="space-y-2">
                {startups.map((s, i) => (
                  <div key={s.companyId} className="p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-[13px] font-semibold text-zinc-900">
                        {i + 1}. {s.companyName}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStartup(i)}
                        className="text-zinc-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="부 (예: 1부)"
                        value={s.session}
                        onChange={(e) => updateStartup(i, { session: e.target.value })}
                        className="h-8 px-2 rounded border border-zinc-200 text-[11.5px]"
                      />
                      <input
                        type="number"
                        placeholder="순서"
                        value={s.pitchOrder}
                        onChange={(e) => updateStartup(i, { pitchOrder: e.target.value })}
                        className="h-8 px-2 rounded border border-zinc-200 text-[11.5px]"
                      />
                      <input
                        type="text"
                        placeholder="14:00"
                        value={s.pitchTime}
                        onChange={(e) => updateStartup(i, { pitchTime: e.target.value })}
                        className="h-8 px-2 rounded border border-zinc-200 text-[11.5px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-10 px-4 rounded-lg border border-zinc-200 text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={startups.length === 0}
              className="h-10 px-4 rounded-lg bg-brand text-white text-[13px] font-semibold hover:bg-brand/90 disabled:opacity-40"
            >
              다음: 심사역 초청 →
            </button>
          </div>
        </div>
      ) : null}

      {/* Step 3 */}
      {step === 3 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <div className="text-[13px] font-semibold text-zinc-900 mb-3">
            초청할 심사역 선택
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={reviewerSearch}
              onChange={(e) => setReviewerSearch(e.target.value)}
              placeholder="이름·소속·이메일 검색"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-zinc-200 text-[12.5px]"
            />
          </div>

          {reviewersLoading ? (
            <div className="py-6 text-center text-[12px] text-zinc-500">
              불러오는 중...
            </div>
          ) : filteredReviewers.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-zinc-500">
              등록된 심사역이 없습니다. 심사역 관리 페이지에서 먼저 등록해 주세요.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {filteredReviewers.map((r) => {
                const on = selectedReviewers.has(r.id);
                const conf = conflicts[r.id] ?? [];
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      on
                        ? "bg-brand/5 border border-brand/30"
                        : "hover:bg-zinc-50 border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleReviewer(r.id)}
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
                            주의: 이 심사역은 아래 기업과 과거 이력이 있습니다 —{" "}
                            {conf.map((c) => `${c.companyName}(${c.roundDate})`).join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-[11.5px] text-zinc-500">
            <div>
              {selectedReviewers.size}명 선택됨
              {conflictLoading ? " · 이력 확인 중..." : ""}
            </div>
          </div>

          {error ? (
            <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-[12px] text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-10 px-4 rounded-lg border border-zinc-200 text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="h-10 px-5 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 disabled:opacity-40 inline-flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              데모데이 생성
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-zinc-800 mb-1.5">
        {label}
        {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
      </label>
      {children}
    </div>
  );
}
