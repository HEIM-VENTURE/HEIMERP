import Link from "next/link";
import {
  STATUS_LABEL,
  STATUS_COLOR,
  GROWTH_STAGE_LABEL,
  REVENUE_LABEL,
  type ApplicationStatus,
} from "@/lib/mock-applications";
import { listApplications } from "@/lib/applications";

export const metadata = { title: "기업 접수 · HEIM ERP" };
export const dynamic = "force-dynamic";

const TABS: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "new", label: "신규" },
  { key: "go", label: "GO" },
  { key: "more_docs", label: "자료 요청" },
  { key: "no_go", label: "NO-GO" },
];

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function ApplicationsListPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeTab = (params.status ?? "all") as ApplicationStatus | "all";

  const all = await listApplications();
  const rows = activeTab === "all" ? all : all.filter((a) => a.status === activeTab);

  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = t.key === "all" ? all.length : all.filter((a) => a.status === t.key).length;
    return acc;
  }, {});

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">기업 접수</h1>
          <p className="text-sm text-zinc-500 mt-1">
            랜딩 페이지로 접수된 기업 신청서를 검토하고 GO / 조건부 GO / 자료요청 / NO-GO 를 결정합니다.
          </p>
        </div>
        <div className="text-xs text-zinc-400">
          Supabase 실데이터 · NO-GO 처리된 신청은 목록에서 숨김
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-zinc-200">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/applications" : `/admin/applications?status=${t.key}`}
              className={`px-3.5 py-2.5 text-[13px] rounded-t-md transition-colors -mb-px border-b-2 ${
                active
                  ? "border-brand text-zinc-900 font-medium"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[11px] text-zinc-400">{counts[t.key]}</span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 bg-zinc-50/80 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium">기업명</th>
              <th className="text-left px-5 py-3 font-medium w-40">접수번호</th>
              <th className="text-left px-5 py-3 font-medium">한 줄 소개</th>
              <th className="text-left px-5 py-3 font-medium w-40">성장 단계</th>
              <th className="text-left px-5 py-3 font-medium w-28">매출</th>
              <th className="text-left px-5 py-3 font-medium w-24">담당</th>
              <th className="text-left px-5 py-3 font-medium w-28">상태</th>
              <th className="text-left px-5 py-3 font-medium w-24">접수일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((a) => {
              const color = STATUS_COLOR[a.status];
              const receivedDate = a.received_at.split("T")[0].slice(5);
              return (
                <tr key={a.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="text-zinc-900 hover:text-brand hover:underline font-medium"
                    >
                      {a.company_name}
                    </Link>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {a.ceo_name} · {a.headcount}명
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11.5px] text-zinc-500">
                    {a.application_no}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-700 text-[13px] truncate max-w-[280px]" title={a.tagline}>
                    {a.tagline}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-600">
                    {GROWTH_STAGE_LABEL[a.growth_stage] ?? a.growth_stage}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-600">
                    {REVENUE_LABEL[a.revenue_range] ?? a.revenue_range}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-zinc-700">
                    {a.reviewer ?? <span className="text-zinc-300">미배정</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: color.bg, color: color.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color.dot }} />
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-500 tabular-nums">
                    {receivedDate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">해당 상태의 접수가 없습니다</div>
        ) : null}
      </div>
    </>
  );
}
