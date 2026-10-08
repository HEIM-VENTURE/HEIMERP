import { createClient } from "@/lib/supabase/server";
import { FolderOpen, CheckCircle2, Circle } from "lucide-react";
import { PortalFileManager, type PortalFile } from "./portal-file-manager";

// 하임 준비서류 10종 (고객 기업이 제출해야 하는 자료)
// required=false 는 조건부/선택 항목
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

export const dynamic = "force-dynamic";

export default async function CompanyFilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id")
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

  const [{ data: company }, { data: files }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", companyId).single(),
    supabase
      .from("files")
      .select("id, kind, path, filename, size, mime_type, source, uploader_id, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ]);

  const list = (files ?? []) as PortalFile[];

  // kind 별 카운트
  const countByKind = list.reduce<Record<string, number>>((acc, f) => {
    acc[f.kind] = (acc[f.kind] ?? 0) + 1;
    return acc;
  }, {});

  const requiredMissing = REQUIRED_KINDS.filter((r) => r.required && !countByKind[r.kind]).length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-[22px] font-bold text-zinc-900 flex items-center gap-2 mb-1">
        <FolderOpen className="w-5 h-5 text-brand" />
        내 자료
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        <b>{company?.name}</b> · 세금계산서·계약서·IR Deck 등을 업로드하면 하임 담당자가 바로 확인할 수 있습니다.
      </p>

      {/* 제출 체크리스트 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
            📋 제출 체크리스트
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {REQUIRED_KINDS.map((r) => {
            const count = countByKind[r.kind] ?? 0;
            const done = count > 0;
            return (
              <div
                key={r.kind}
                className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                  done
                    ? "bg-emerald-50/50 border-emerald-200"
                    : r.required
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-zinc-50 border-zinc-200"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-300 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium text-zinc-900 flex items-center gap-1">
                    {r.label}
                    {r.required ? (
                      <span className="text-[9.5px] font-semibold text-rose-500">필수</span>
                    ) : (
                      <span className="text-[9.5px] font-semibold text-zinc-400">선택</span>
                    )}
                  </div>
                  <div className={`text-[11px] ${done ? "text-emerald-700" : "text-zinc-400"}`}>
                    {done ? `${count}건 제출` : "미제출"}
                  </div>
                  {r.hint && !done ? (
                    <div className="text-[10px] text-zinc-400 mt-0.5">{r.hint}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <PortalFileManager currentUserId={profile.id} files={list} />
    </div>
  );
}
