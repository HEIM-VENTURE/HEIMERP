import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SALES_STAGE_LABELS,
  CONSULTING_STAGE_LABELS,
  CONSULTING_STAGES_ORDER,
  PROGRAM_GRADE_LABELS,
  PROGRAM_GRADE_COLORS,
  SALES_STAGE_COLORS,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function CompanyDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) notFound();

  const consultingIdx = company.consulting_stage
    ? CONSULTING_STAGES_ORDER.indexOf(company.consulting_stage)
    : -1;

  return (
    <>
      <div className="text-xs text-zinc-400 mb-2">
        <Link href="/admin/pipeline" className="hover:text-zinc-700">
          기업 파이프라인
        </Link>{" "}
        / <span className="text-zinc-600">{company.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
            {company.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900">{company.name}</h1>
              <span
                className={`px-2 py-0.5 text-xs rounded ${SALES_STAGE_COLORS[company.sales_stage as keyof typeof SALES_STAGE_COLORS]?.badge ?? "bg-zinc-100"}`}
              >
                {SALES_STAGE_LABELS[company.sales_stage as keyof typeof SALES_STAGE_LABELS]}
              </span>
              {company.program_grade ? (
                <span
                  className={`px-2 py-0.5 text-xs rounded ${PROGRAM_GRADE_COLORS[company.program_grade as keyof typeof PROGRAM_GRADE_COLORS]}`}
                >
                  {PROGRAM_GRADE_LABELS[company.program_grade as keyof typeof PROGRAM_GRADE_LABELS]}
                  {company.proposal_amount ? ` ${company.proposal_amount}만` : ""}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-500">
              {[company.main_item, company.address, company.ceo_name && `대표 ${company.ceo_name}`]
                .filter(Boolean)
                .join(" · ") || "추가 정보 없음"}
            </p>
          </div>
        </div>
      </div>

      {/* 컨설팅 타임라인 */}
      {company.consulting_stage ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">컨설팅 진행 타임라인</h2>
            <span className="text-xs text-zinc-500">
              {consultingIdx + 1}/{CONSULTING_STAGES_ORDER.length} 단계
            </span>
          </div>
          <div className="relative">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-zinc-100" />
            <div
              className="absolute top-3 left-0 h-0.5 bg-emerald-500"
              style={{ width: `${((consultingIdx + 1) / CONSULTING_STAGES_ORDER.length) * 100}%` }}
            />
            <div className={`relative grid gap-1`} style={{ gridTemplateColumns: `repeat(${CONSULTING_STAGES_ORDER.length}, 1fr)` }}>
              {CONSULTING_STAGES_ORDER.map((s, i) => {
                const done = i < consultingIdx;
                const current = i === consultingIdx;
                return (
                  <div key={s} className="flex flex-col items-center text-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                        done
                          ? "bg-emerald-500"
                          : current
                            ? "bg-emerald-500 ring-4 ring-emerald-100"
                            : "bg-white border-2 border-zinc-200"
                      }`}
                    >
                      {done ? "✓" : current ? "●" : ""}
                    </div>
                    <div
                      className={`text-[10px] mt-2 ${
                        current ? "text-zinc-900 font-bold" : done ? "text-zinc-700" : "text-zinc-400"
                      }`}
                    >
                      {CONSULTING_STAGE_LABELS[s]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* 기본 정보 */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">기본 정보</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Info label="회사명" value={company.name} />
          <Info label="대표자" value={company.ceo_name} />
          <Info label="소재지" value={company.address} />
          <Info label="설립일자" value={company.founded_at} />
          <Info label="대표 연락처" value={company.phone} />
          <Info label="대표 이메일" value={company.email} />
          <Info label="주요 아이템" value={company.main_item} colSpan />
          <Info label="직전년도 매출" value={company.last_year_revenue ? `${company.last_year_revenue}백만원` : null} />
          <Info label="접수목적" value={company.inquiry_purpose} />
          <Info label="접수일" value={company.received_at} />
          <Info label="계약일" value={company.contracted_at} />
          <Info label="착수일" value={company.started_at} />
          {company.notes ? <Info label="비고" value={company.notes} colSpan /> : null}
        </div>
        {!company.ceo_name && !company.phone && !company.email ? (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
            💡 노션에서 가져올 때 메타데이터만 옮겼습니다. 대표자·연락처·이메일 등은 추후 채우시거나 다음 import 단계에서 추가 가능합니다.
          </div>
        ) : null}
      </div>

      <div className="text-xs text-zinc-400">
        ※ 미팅·To-do·자료·계약 등 탭은 추후 구현 예정
      </div>
    </>
  );
}

function Info({ label, value, colSpan }: { label: string; value: string | number | null; colSpan?: boolean }) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <span className="text-zinc-500">{label}</span>
      <div className="text-zinc-900 mt-0.5">{value || <span className="text-zinc-300">—</span>}</div>
    </div>
  );
}
