import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FolderOpen, CheckCircle2, Circle, ExternalLink, FileText } from "lucide-react";
import { listFilesInDriveFolder, type DriveFileRow } from "@/lib/google-drive";
import { inferKindFromFilename } from "@/lib/kind-matcher";

export const dynamic = "force-dynamic";

// 하임 준비서류 10종
const REQUIRED_KINDS = [
  { kind: "business_cert", label: "① 사업자등록증", required: true, hint: null },
  { kind: "corp_registry", label: "② 법인등기부등본", required: true, hint: null },
  { kind: "shareholders", label: "③ 주주명부", required: true, hint: null },
  { kind: "insurance_members", label: "④ 4대보험 가입자명부", required: false, hint: "대표자만 있으면 생략 가능" },
  { kind: "small_biz_cert", label: "⑤ 소상공인확인서", required: false, hint: "없으면 발급 안내 예정" },
  { kind: "financial", label: "⑥ 최근 2개년 재무제표", required: true, hint: null },
  { kind: "vat_cert", label: "⑦ 부가세 과세표준증명원", required: true, hint: null },
  { kind: "revenue_forecast", label: "⑧ 당해년도 예상 매출", required: true, hint: null },
  { kind: "company_intro", label: "⑨ 회사소개서·홈페이지 자료", required: true, hint: null },
  { kind: "exec_profile", label: "⑩ 주요 경영진 이력·사진", required: true, hint: null },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default async function CompanyFilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id;

  if (!companyId) {
    return (
      <div className="max-w-2xl bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
        회사 연결이 아직 되지 않았습니다. 담당자에게 문의해주세요.
      </div>
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name, drive_folder_id, drive_folder_url")
    .eq("id", companyId)
    .single();

  // Drive 폴더 파일 리스트 조회
  let driveFiles: DriveFileRow[] = [];
  let driveError: string | null = null;
  if (company?.drive_folder_id) {
    const r = await listFilesInDriveFolder(company.drive_folder_id);
    if (r.ok) driveFiles = r.files;
    else driveError = r.error;
  }

  // kind 별 자동 매칭된 파일 그룹핑
  const filesByKind = new Map<string, DriveFileRow[]>();
  const unmatchedFiles: DriveFileRow[] = [];
  for (const f of driveFiles) {
    const kind = inferKindFromFilename(f.name);
    if (kind) {
      const arr = filesByKind.get(kind) ?? [];
      arr.push(f);
      filesByKind.set(kind, arr);
    } else {
      unmatchedFiles.push(f);
    }
  }

  const requiredMissing = REQUIRED_KINDS.filter((r) => r.required && !filesByKind.has(r.kind)).length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-[22px] font-bold text-zinc-900 flex items-center gap-2 mb-1">
        <FolderOpen className="w-5 h-5 text-brand" />
        내 자료 (Google Drive)
      </h1>
      <p className="text-sm text-zinc-500 mb-5">
        <b>{company?.name}</b> · Drive 폴더 안 파일을 자동으로 분류해서 보여드립니다.
      </p>

      {!company?.drive_folder_id ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-[13px] text-amber-900">
          Drive 폴더가 아직 연결되지 않았습니다. 하임 담당자에게 문의해주세요.
        </div>
      ) : driveError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-[13px] text-rose-900 mb-5">
          Drive 조회 실패: {driveError}
          <br />
          <a
            href={company.drive_folder_url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline mt-2 inline-block"
          >
            Drive 폴더 직접 열기 →
          </a>
        </div>
      ) : (
        <>
          {/* 상단 Drive 바로가기 */}
          <div className="flex items-center justify-between gap-3 mb-5 p-4 bg-brand/5 border border-brand/20 rounded-xl flex-wrap">
            <div>
              <div className="text-[12.5px] font-semibold text-zinc-900">
                📁 자료는 Google Drive 폴더에 올려주세요
              </div>
              <div className="text-[11.5px] text-zinc-600 mt-0.5">
                파일명에 자료 이름이 들어가면 아래 체크리스트에 자동 분류됩니다 (예: "사업자등록증.pdf")
              </div>
            </div>
            <a
              href={company.drive_folder_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-brand text-white text-[13px] font-medium hover:opacity-90 whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              Drive 폴더 열기
            </a>
          </div>

          {/* 제출 체크리스트 */}
          <section className="bg-white border border-zinc-200 rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
                📋 제출 체크리스트
                <span className="text-[11px] text-zinc-400 font-normal">· Drive 파일명 기준 자동 분류</span>
              </h2>
              {requiredMissing > 0 ? (
                <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  필수 {requiredMissing}건 미제출
                </span>
              ) : (
                <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  ✓ 필수 자료 모두 제출
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {REQUIRED_KINDS.map((r) => {
                const matched = filesByKind.get(r.kind) ?? [];
                const done = matched.length > 0;
                return (
                  <div
                    key={r.kind}
                    className={`p-3 rounded-lg border ${
                      done
                        ? "bg-emerald-50/40 border-emerald-200"
                        : r.required
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-zinc-50 border-zinc-200"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-zinc-900 flex items-center gap-1 flex-wrap">
                          {r.label}
                          {r.required ? (
                            <span className="text-[9.5px] font-semibold text-rose-500">필수</span>
                          ) : (
                            <span className="text-[9.5px] font-semibold text-zinc-400">선택</span>
                          )}
                        </div>
                        <div className={`text-[11px] ${done ? "text-emerald-700" : "text-zinc-400"}`}>
                          {done ? `${matched.length}건 Drive 에 있음` : "미제출"}
                        </div>
                        {r.hint && !done ? (
                          <div className="text-[10px] text-zinc-400 mt-0.5">{r.hint}</div>
                        ) : null}
                      </div>
                    </div>
                    {done ? (
                      <ul className="mt-1.5 ml-6 space-y-0.5">
                        {matched.slice(0, 3).map((f) => (
                          <li key={f.id} className="text-[11px] truncate">
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-700 hover:text-brand hover:underline inline-flex items-center gap-1"
                            >
                              <FileText className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </a>
                          </li>
                        ))}
                        {matched.length > 3 ? (
                          <li className="text-[10px] text-zinc-400">+{matched.length - 3}개 더</li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 매칭 안된 파일 (안내) */}
          {unmatchedFiles.length > 0 ? (
            <section className="bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-2 inline-flex items-center gap-1.5">
                📄 기타 파일
                <span className="text-[11px] text-zinc-400 font-normal">
                  · {unmatchedFiles.length}건 · 체크리스트와 매칭 안 됨
                </span>
              </h2>
              <p className="text-[11.5px] text-zinc-500 mb-3">
                파일명에 자료 이름 (예: "사업자등록증", "재무제표") 이 들어가면 자동 분류됩니다.
              </p>
              <ul className="space-y-1">
                {unmatchedFiles.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-[12px] p-2 rounded hover:bg-zinc-50">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate text-zinc-800 hover:text-brand hover:underline"
                    >
                      {f.name}
                    </a>
                    <span className="text-[10.5px] text-zinc-400 shrink-0 tabular-nums">
                      {formatSize(f.size)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
