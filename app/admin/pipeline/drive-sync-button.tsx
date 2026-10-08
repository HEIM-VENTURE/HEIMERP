"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderSync, X, CheckCircle2, AlertTriangle, FolderOpen } from "lucide-react";
import { syncDriveWithCompanies, type DriveSyncResult } from "./drive-sync-actions";

export function DriveSyncButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<DriveSyncResult | null>(null);
  const [open, setOpen] = useState(false);

  const run = () => {
    setResult(null);
    start(async () => {
      const r = await syncDriveWithCompanies();
      setResult(r);
      setOpen(true);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white border border-brand text-brand text-[12.5px] font-medium hover:bg-brand/5 transition-colors disabled:opacity-50"
      >
        <FolderSync className={`w-3.5 h-3.5 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Drive 매칭 중…" : "Drive 자동 매칭"}
      </button>

      {open && result ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-[16px] font-bold text-zinc-900 inline-flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-brand" />
                Drive 매칭 결과
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-500"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {result.error ? (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-[13px] text-rose-700">
                {result.error}
              </div>
            ) : (
              <>
                {/* 요약 */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <StatBox label="Drive 폴더" value={result.totalFolders ?? 0} />
                  <StatBox label="ERP 기업" value={result.totalCompanies ?? 0} />
                  <StatBox
                    label="새로 연결"
                    value={result.autoLinked ?? 0}
                    tint="#10B981"
                  />
                </div>

                {/* 성공 */}
                {result.linkedCompanies && result.linkedCompanies.length > 0 ? (
                  <Section
                    title={`✅ 자동 연결 ${result.linkedCompanies.length}곳`}
                    tone="emerald"
                  >
                    <ul className="space-y-1 text-[12.5px]">
                      {result.linkedCompanies.map((c) => (
                        <li key={c.id} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <a
                            href={`/admin/companies/${c.id}`}
                            className="text-zinc-900 hover:text-brand hover:underline"
                          >
                            {c.name}
                          </a>
                          <a
                            href={c.folderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10.5px] text-zinc-400 hover:text-brand ml-auto"
                          >
                            Drive 열기 →
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : (
                  <Section title="새로 연결된 기업 없음" tone="zinc">
                    <p className="text-[12px] text-zinc-500">
                      기업명 ↔ 폴더명이 매칭되지 않거나, 이미 모두 연결되어 있습니다.
                    </p>
                  </Section>
                )}

                {/* 미매칭 Drive 폴더 */}
                {result.unmatchedFolders && result.unmatchedFolders.length > 0 ? (
                  <Section
                    title={`📂 ERP에 없는 Drive 폴더 ${result.unmatchedFolders.length}곳`}
                    tone="amber"
                  >
                    <p className="text-[11.5px] text-amber-700 mb-2">
                      Drive에만 있고 ERP엔 없는 기업. 필요하면 신규 등록하세요.
                    </p>
                    <ul className="space-y-1 text-[12.5px] max-h-48 overflow-y-auto">
                      {result.unmatchedFolders.map((f) => (
                        <li key={f.name} className="flex items-center gap-2">
                          <FolderOpen className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="text-zinc-800">{f.name}</span>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10.5px] text-zinc-400 hover:text-brand ml-auto"
                          >
                            Drive 열기 →
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}

                {/* ERP 기업 중 Drive 폴더 없는 것 */}
                {result.companiesWithoutFolder && result.companiesWithoutFolder.length > 0 ? (
                  <Section
                    title={`🏢 Drive 폴더 없는 기업 ${result.companiesWithoutFolder.length}곳`}
                    tone="zinc"
                  >
                    <p className="text-[11.5px] text-zinc-600 mb-2">
                      ERP엔 있지만 매칭되는 Drive 폴더가 없음. 상세 페이지에서 수동 생성하거나 링크 붙여넣기.
                    </p>
                    <ul className="space-y-1 text-[12.5px] max-h-40 overflow-y-auto">
                      {result.companiesWithoutFolder.map((c) => (
                        <li key={c.id} className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-zinc-400 shrink-0" />
                          <a
                            href={`/admin/companies/${c.id}`}
                            className="text-zinc-800 hover:text-brand hover:underline"
                          >
                            {c.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}
              </>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 px-4 rounded-md bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatBox({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
      <div className="text-[10.5px] font-medium text-zinc-500 uppercase mb-0.5">{label}</div>
      <div className="text-[20px] font-bold tabular-nums" style={{ color: tint ?? "#1F2A36" }}>
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "emerald" | "amber" | "zinc";
  children: React.ReactNode;
}) {
  const toneCls = {
    emerald: "bg-emerald-50/50 border-emerald-200",
    amber: "bg-amber-50/50 border-amber-200",
    zinc: "bg-zinc-50 border-zinc-200",
  }[tone];
  return (
    <div className={`mb-3 p-3 rounded-lg border ${toneCls}`}>
      <h4 className="text-[12.5px] font-semibold text-zinc-900 mb-2">{title}</h4>
      {children}
    </div>
  );
}
