import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  SALES_STAGE_LABELS,
  SALES_STAGES_ORDER,
  SALES_STAGE_COLORS,
  CONSULTING_STAGE_LABELS,
  CONSULTING_STAGES_ORDER,
  PROGRAM_GRADE_LABELS,
  PROGRAM_GRADE_COLORS,
} from "@/lib/labels";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PipelineFilters } from "./filters";
import { NewCompanyModal } from "./company-modals";

export const dynamic = "force-dynamic";

type Company = {
  id: number;
  name: string;
  sales_stage: keyof typeof SALES_STAGE_LABELS;
  consulting_stage: keyof typeof CONSULTING_STAGE_LABELS | null;
  program_grade: keyof typeof PROGRAM_GRADE_LABELS | null;
  proposal_amount: number | null;
  address: string | null;
  main_item: string | null;
  received_at: string;
  started_at: string | null;
  notes: string | null;
  drop_reason: string | null;
  custom_fields: { pm?: string } | null;
};

type SearchParams = {
  q?: string;
  stage?: string;
  grade?: string;
  consulting?: string;
  dropped?: string;
  sort?: string;
  dir?: string;
};

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const stage = sp.stage ?? "all";
  const grade = sp.grade ?? "all";
  const consulting = sp.consulting ?? "all";
  const dropped = sp.dropped ?? "active"; // active(드랍 제외) | dropped(드랍만) | all
  const sort = sp.sort ?? "";
  const dir = sp.dir ?? "asc";

  const SORTABLE: Record<string, string> = {
    name: "name",
    sales_stage: "sales_stage",
    program_grade: "program_grade",
    proposal_amount: "proposal_amount",
    started_at: "started_at",
  };
  const sortCol = sort && SORTABLE[sort] ? SORTABLE[sort] : null;
  const ascending = dir !== "desc";

  const supabase = await createClient();

  // 필터된 (테이블용) 쿼리 구성
  let listQuery = supabase
    .from("companies")
    .select(
      "id, name, sales_stage, consulting_stage, program_grade, proposal_amount, address, main_item, received_at, started_at, notes, drop_reason, custom_fields"
    );

  if (sortCol) {
    listQuery = listQuery
      .order(sortCol, { ascending, nullsFirst: false })
      .order("name", { ascending: true });
  } else {
    listQuery = listQuery
      .order("sales_stage", { ascending: true })
      .order("consulting_stage", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });
  }

  if (dropped === "active") listQuery = listQuery.is("drop_reason", null);
  else if (dropped === "dropped") listQuery = listQuery.not("drop_reason", "is", null);

  if (q) {
    const safe = q.replace(/[%,]/g, "");
    listQuery = listQuery.or(`name.ilike.%${safe}%,address.ilike.%${safe}%,main_item.ilike.%${safe}%`);
  }
  if (stage !== "all") {
    listQuery = listQuery.eq("sales_stage", stage);
  }
  if (grade !== "all") {
    if (grade === "none") listQuery = listQuery.is("program_grade", null);
    else listQuery = listQuery.eq("program_grade", grade);
  }
  if (consulting !== "all") {
    if (consulting === "none") listQuery = listQuery.is("consulting_stage", null);
    else listQuery = listQuery.eq("consulting_stage", consulting);
  }

  // KPI용 전체 + 필터된 리스트 + HVP 목록 동시
  const [allRes, listRes, hvpsRes] = await Promise.all([
    supabase.from("companies").select("id, sales_stage, consulting_stage"),
    listQuery,
    supabase.from("hvp").select("id, name, cohort").order("name", { ascending: true }),
  ]);

  const all = (allRes.data as { sales_stage: Company["sales_stage"]; consulting_stage: Company["consulting_stage"] }[]) ?? [];
  const { data, error } = listRes;
  const list: Company[] = (data as Company[]) ?? [];
  const hvps = (hvpsRes.data as { id: string; name: string; cohort: string | null }[]) ?? [];

  // 통계 (전체 기준)
  const total = all.length;
  const inProgress = all.filter((c) => c.sales_stage !== "kickoff").length;
  const consultingCount = all.filter(
    (c) => c.sales_stage === "kickoff" && c.consulting_stage !== "final_closing"
  ).length;
  const closed = all.filter((c) => c.consulting_stage === "final_closing").length;

  const byStage = SALES_STAGES_ORDER.map((s) => ({
    key: s,
    label: SALES_STAGE_LABELS[s],
    count: all.filter((c) => c.sales_stage === s).length,
    color: SALES_STAGE_COLORS[s].dot,
  }));

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">기업 파이프라인</h1>
          <p className="text-sm text-zinc-500 mt-1">한 화면에 모든 기업과 단계</p>
        </div>
        <div className="flex gap-2">
          <NewCompanyModal hvps={hvps} label="+ 신규 기업" />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-12 gap-3 mb-6">
        <div className="col-span-6 sm:col-span-3 bg-white border border-zinc-200 rounded-2xl p-4">
          <div className="text-xs text-zinc-500">전체 기업</div>
          <div className="text-2xl font-bold text-zinc-900 mt-0.5">{total}</div>
        </div>
        <div className="col-span-6 sm:col-span-3 bg-white border border-zinc-200 rounded-2xl p-4">
          <div className="text-xs text-zinc-500">영업 진행 중</div>
          <div className="text-2xl font-bold text-blue-600 mt-0.5">{inProgress}</div>
        </div>
        <div className="col-span-6 sm:col-span-3 bg-white border border-zinc-200 rounded-2xl p-4">
          <div className="text-xs text-zinc-500">컨설팅 진행 중</div>
          <div className="text-2xl font-bold text-emerald-600 mt-0.5">{consultingCount}</div>
        </div>
        <div className="col-span-6 sm:col-span-3 bg-white border border-zinc-200 rounded-2xl p-4">
          <div className="text-xs text-zinc-500">Final Closing</div>
          <div className="text-2xl font-bold text-zinc-900 mt-0.5">{closed}</div>
        </div>

        <div className="col-span-12 bg-white border border-zinc-200 rounded-2xl p-4">
          <div className="flex h-7 rounded-md overflow-hidden">
            {byStage.map((s) => {
              const pct = total > 0 ? (s.count / total) * 100 : 0;
              return (
                <div
                  key={s.key}
                  className={`flex items-center justify-center text-[10px] text-white font-medium ${s.color}`}
                  style={{ width: `${pct}%` }}
                  title={`${s.label}: ${s.count}개`}
                >
                  {pct >= 5 ? s.count : ""}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
            {byStage.map((s) => (
              <div key={s.key} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                <span>
                  {s.label} {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 필터 (클라이언트) */}
      <PipelineFilters
        initialQuery={q}
        initialStage={stage}
        initialGrade={grade}
        initialConsulting={consulting}
        initialDropped={dropped}
        resultCount={list.length}
      />

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          데이터 로드 실패: {error.message}
        </div>
      ) : null}

      {/* 테이블 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs bg-zinc-50/80 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3.5"><SortableHeader column="name" label="회사명" /></th>
              <th className="text-left px-5 py-3.5 w-28 font-medium text-zinc-500">담당 PM</th>
              <th className="text-left px-5 py-3.5 w-32"><SortableHeader column="sales_stage" label="영업 단계" /></th>
              <th className="text-left px-5 py-3.5 w-56 font-medium text-zinc-500">컨설팅 진행</th>
              <th className="text-left px-5 py-3.5 w-28"><SortableHeader column="program_grade" label="등급" /></th>
              <th className="text-right px-5 py-3.5 w-28"><SortableHeader column="proposal_amount" label="금액" align="right" /></th>
              <th className="text-left px-5 py-3.5 w-32"><SortableHeader column="started_at" label="착수일" /></th>
              <th className="text-left px-5 py-3.5 w-56 font-medium text-zinc-500">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((c) => {
              const consultingIdx = c.consulting_stage
                ? CONSULTING_STAGES_ORDER.indexOf(c.consulting_stage)
                : -1;
              const consultingPct =
                consultingIdx >= 0
                  ? Math.round(((consultingIdx + 1) / CONSULTING_STAGES_ORDER.length) * 100)
                  : 0;
              const stageColor = SALES_STAGE_COLORS[c.sales_stage];

              return (
                <tr key={c.id} className={`hover:bg-zinc-50/70 group transition-colors ${c.drop_reason ? "opacity-60" : ""}`}>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/companies/${c.id}`} className="block">
                      <div className="font-medium text-zinc-900 group-hover:text-zinc-950 truncate flex items-center gap-1.5">
                        {c.drop_reason ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">드랍</span>
                        ) : null}
                        <span className="truncate">{c.name}</span>
                      </div>
                      {c.main_item || c.address ? (
                        <div className="text-xs text-zinc-400 truncate">
                          {[c.main_item, c.address].filter(Boolean).join(" · ")}
                        </div>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.custom_fields?.pm ? (
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {c.custom_fields.pm.slice(0, 1)}
                        </span>
                        <span className="text-xs text-zinc-600 truncate">{c.custom_fields.pm}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-xs font-medium rounded-full ${stageColor.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stageColor.dot}`} />
                      {SALES_STAGE_LABELS[c.sales_stage]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.consulting_stage ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-zinc-700 truncate">{CONSULTING_STAGE_LABELS[c.consulting_stage]}</span>
                          <span className="text-zinc-400 ml-2 shrink-0">{consultingPct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              c.consulting_stage === "final_closing" ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${consultingPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.program_grade ? (
                      <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-xs font-medium rounded-full ${PROGRAM_GRADE_COLORS[c.program_grade]}`}>
                        {PROGRAM_GRADE_LABELS[c.program_grade]}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-zinc-700 tabular-nums">
                    {c.proposal_amount ? (
                      `${c.proposal_amount.toLocaleString()}만`
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.started_at ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-md bg-zinc-100 text-xs text-zinc-600">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {formatDate(c.started_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-500 align-top" title={c.notes ?? ""}>
                    {c.notes ? (
                      <div className="line-clamp-3 max-w-[220px] whitespace-pre-wrap break-words">
                        {c.notes}
                      </div>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            {q || stage !== "all" || grade !== "all" || consulting !== "all"
              ? "필터에 맞는 기업이 없습니다"
              : "아직 기업이 없습니다"}
          </div>
        ) : null}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 필터 적용 시 URL이 바뀌어요 — 북마크하거나 링크 공유 가능합니다.
      </div>
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
