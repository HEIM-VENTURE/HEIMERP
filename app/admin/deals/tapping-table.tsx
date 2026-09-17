import Link from "next/link";
import { LayoutGrid, Table2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditCell, EligibleCell, PmCell, AddTappingButton, DeleteRowButton } from "./tapping-cells";
import { TappingFiltersBar, type TappingFilters } from "./tapping-filters";
import { TappingSummaryCell, type TappingEvent } from "./tapping-events-panel";
import { TappingKanban } from "./tapping-kanban";

type Row = {
  id: string;
  seq: number | null;
  company_id: number | null;
  company_name_snapshot: string;
  prev_revenue: string | null;
  headcount: string | null;
  established_at: string | null;
  personal_fund_eligible: string | null;
  lips_eligible: string | null;
  tips_eligible: string | null;
  progress_status: string | null;
  confirmed_operator: string | null;
  tapping_1: string | null;
  tapping_2: string | null;
  tapping_3: string | null;
  tapping_4: string | null;
  tapping_5: string | null;
  pm: string | null;
  updated_at: string;
};

type RowWithEvents = Row & { events: TappingEvent[] };

function matchesFilters(r: RowWithEvents, f: TappingFilters): boolean {
  if (f.q) {
    const q = f.q.trim().toLowerCase();
    if (q) {
      const hay = [
        r.company_name_snapshot,
        r.confirmed_operator,
        ...r.events.map((e) => e.operator),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  if (f.operator === "assigned" && !r.confirmed_operator) return false;
  if (f.operator === "unassigned" && r.confirmed_operator) return false;

  const matchEligible = (val: string | null, want: string | undefined): boolean => {
    if (!want || want === "all") return true;
    if (want === "yes") return val === "여";
    if (want === "no") return val === "부";
    if (want === "wait") return val === "대기중";
    if (want === "none") return !val;
    return true;
  };
  if (!matchEligible(r.lips_eligible, f.lips)) return false;
  if (!matchEligible(r.tips_eligible, f.tips)) return false;

  const hasAnyTapping = r.events.length > 0;
  if (f.tapping === "in_progress" && !hasAnyTapping) return false;
  if (f.tapping === "none" && hasAnyTapping) return false;

  if (f.pm && f.pm !== "all") {
    if (f.pm === "none") {
      if (r.pm) return false;
    } else {
      // "mine" or 특정 이름 — 문자열 그대로 비교 (mine 은 서버에서 currentUserName 으로 치환됨)
      if (r.pm !== f.pm) return false;
    }
  }

  return true;
}

function sortRows(rows: RowWithEvents[], f: TappingFilters): RowWithEvents[] {
  const sort = f.sort ?? "seq";
  const asc = (f.dir ?? "asc") === "asc";
  const sign = asc ? 1 : -1;
  const arr = [...rows];
  arr.sort((a, b) => {
    if (sort === "name") {
      return sign * a.company_name_snapshot.localeCompare(b.company_name_snapshot, "ko");
    }
    if (sort === "updated") {
      return sign * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    }
    // seq
    const av = a.seq ?? Number.MAX_SAFE_INTEGER;
    const bv = b.seq ?? Number.MAX_SAFE_INTEGER;
    return sign * (av - bv);
  });
  return arr;
}

export async function TappingTable({
  filters,
  mode = "kanban",
}: {
  filters: TappingFilters;
  mode?: "kanban" | "table";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
    : { data: null as { name: string } | null };
  const currentUserName = profile?.name ?? undefined;

  const [{ data, error }, { data: eventsData, error: eventsError }] = await Promise.all([
    supabase
      .from("investor_tappings")
      .select("*")
      .order("seq", { ascending: true, nullsFirst: false }),
    supabase
      .from("tapping_events")
      .select("id, tapping_id, sequence, operator, status, contact_date, notes, created_at")
      .order("sequence", { ascending: true }),
  ]);
  if (eventsError) {
    console.warn("tapping_events not ready:", eventsError.message);
  }

  // filters.pm 이 "mine" 이면 실제 사용자 이름으로 치환
  const resolvedFilters: TappingFilters = {
    ...filters,
    pm: filters.pm === "mine" ? (currentUserName ?? "mine") : filters.pm,
  };

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-[13px] text-rose-700">
        태핑 데이터를 불러올 수 없습니다: {error.message}
        <br />
        <span className="text-[11.5px] text-rose-500">
          Supabase 에서 0032_investor_tappings.sql 실행 여부를 확인해주세요.
        </span>
      </div>
    );
  }

  const rawRows = (data ?? []) as Row[];
  const eventList = (eventsData ?? []) as (TappingEvent & { tapping_id: string })[];
  const eventsByTapping = new Map<string, TappingEvent[]>();
  for (const e of eventList) {
    const arr = eventsByTapping.get(e.tapping_id) ?? [];
    arr.push({
      id: e.id,
      sequence: e.sequence,
      operator: e.operator,
      status: e.status,
      contact_date: e.contact_date,
      notes: e.notes,
      created_at: e.created_at,
    });
    eventsByTapping.set(e.tapping_id, arr);
  }
  const allRows: RowWithEvents[] = rawRows.map((r) => ({
    ...r,
    events: eventsByTapping.get(r.id) ?? [],
  }));

  const filtered = sortRows(allRows.filter((r) => matchesFilters(r, resolvedFilters)), resolvedFilters);

  // 통계는 항상 '전체' 기준
  const total = allRows.length;
  const confirmed = allRows.filter((r) => r.confirmed_operator).length;
  const inTapping = allRows.filter((r) => r.events.length > 0).length;
  const lipsEligible = allRows.filter((r) => r.lips_eligible === "여").length;
  const tipsEligible = allRows.filter((r) => r.tips_eligible === "여").length;
  const rows = filtered;

  return (
    <>
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <MiniStat label="전체" value={total} suffix="곳" />
        <MiniStat label="운영사 확정" value={confirmed} suffix="곳" tint="#10B981" />
        <MiniStat label="태핑 진행" value={inTapping} suffix="곳" tint="#8B5CF6" />
        <MiniStat label="LIPS 대상" value={lipsEligible} suffix="곳" tint="#3B82F6" />
        <MiniStat label="TIPS 대상" value={tipsEligible} suffix="곳" tint="#F59E0B" />
      </div>

      {/* Filters */}
      <TappingFiltersBar f={filters} currentUserName={currentUserName} />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="text-[12px] text-zinc-500">
          <b className="text-zinc-900 tabular-nums">{rows.length}</b>
          <span className="text-zinc-400"> / {allRows.length}</span>
          <span className="mx-2 text-zinc-300">·</span>
          {mode === "kanban"
            ? "카드 드래그 → 태핑 상태 변경 · 카드 클릭 → 상세 관리"
            : "셀 클릭 → 인라인 편집 · 자격 배지 클릭 → 여/부/대기중"}
        </div>
        <div className="flex items-center gap-2">
          {/* Kanban ↔ Table 스위처 */}
          <div className="inline-flex items-center gap-0.5 p-0.5 bg-zinc-100 rounded-md">
            <Link
              href={buildViewHref(filters, "kanban")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11.5px] font-medium transition-colors ${
                mode === "kanban" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              칸반
            </Link>
            <Link
              href={buildViewHref(filters, "table")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11.5px] font-medium transition-colors ${
                mode === "table" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Table2 className="w-3 h-3" />
              표
            </Link>
          </div>
          <AddTappingButton />
        </div>
      </div>

      {/* 본체: 칸반 or 표 */}
      {mode === "kanban" ? (
        <TappingKanban
          currentUserName={currentUserName}
          rows={rows.map((r) => ({
            id: r.id,
            company_id: r.company_id,
            company_name_snapshot: r.company_name_snapshot,
            confirmed_operator: r.confirmed_operator,
            lips_eligible: r.lips_eligible,
            tips_eligible: r.tips_eligible,
            pm: r.pm,
            events: r.events,
          }))}
        />
      ) : (
        <TableView rows={rows} allRowsCount={allRows.length} />
      )}
    </>
  );
}

function buildViewHref(f: TappingFilters, mode: "kanban" | "table"): string {
  const p = new URLSearchParams();
  p.set("view", "tapping");
  p.set("mode", mode);
  if (f.q) p.set("q", f.q);
  if (f.operator && f.operator !== "all") p.set("operator", f.operator);
  if (f.lips && f.lips !== "all") p.set("lips", f.lips);
  if (f.tips && f.tips !== "all") p.set("tips", f.tips);
  if (f.tapping && f.tapping !== "all") p.set("tapping", f.tapping);
  if (f.pm && f.pm !== "all") p.set("pm", f.pm);
  if (f.sort && f.sort !== "seq") p.set("sort", f.sort);
  if (f.dir && f.dir !== "asc") p.set("dir", f.dir);
  return `/admin/deals?${p.toString()}`;
}

function TableView({ rows, allRowsCount }: { rows: RowWithEvents[]; allRowsCount: number }) {
  return (
    <>

      {/* 표 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-auto max-h-[calc(100vh-14rem)]">
        <table className="w-full text-[12.5px]" style={{ minWidth: 1500 }}>
          <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(228_228_231)]">
            <tr>
              <Th w={40}>#</Th>
              <Th w={140} sticky>기업명</Th>
              <Th w={80} right>직전매출(억)</Th>
              <Th w={60} right>직원수</Th>
              <Th w={110}>설립일</Th>
              <Th w={80} center>개투조합</Th>
              <Th w={70} center>LIPS</Th>
              <Th w={70} center>TIPS</Th>
              <Th w={80} center>담당</Th>
              <Th w={90}>진행여부</Th>
              <Th w={120}>확정 운영사</Th>
              <Th w={260}>태핑 이력 (클릭하여 관리)</Th>
              <Th w={40}></Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-10 text-center text-zinc-400 text-[13px]">
                  {allRowsCount === 0
                    ? "아직 태핑 데이터가 없습니다. 우측 상단 [+ 신규 추가] 로 시작하세요."
                    : "필터 결과가 없습니다."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50/40">
                  <td className="px-2 py-1.5 text-center text-[11.5px] text-zinc-400 tabular-nums">
                    {r.seq ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 sticky left-0 bg-white/95 backdrop-blur-sm">
                    {r.company_id ? (
                      <Link
                        href={`/admin/companies/${r.company_id}`}
                        className="text-[13px] font-medium text-zinc-900 hover:text-brand hover:underline"
                      >
                        {r.company_name_snapshot}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-medium text-zinc-900" title="기업 파이프라인에 미매칭">
                        {r.company_name_snapshot}
                        <span className="ml-1 text-[10px] text-amber-500">⚠</span>
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="prev_revenue" initial={r.prev_revenue} align="right" /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="headcount" initial={r.headcount} align="right" /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="established_at" initial={r.established_at} /></td>
                  <td className="px-1 py-1"><EligibleCell id={r.id} field="personal_fund_eligible" initial={r.personal_fund_eligible} /></td>
                  <td className="px-1 py-1"><EligibleCell id={r.id} field="lips_eligible" initial={r.lips_eligible} /></td>
                  <td className="px-1 py-1"><EligibleCell id={r.id} field="tips_eligible" initial={r.tips_eligible} /></td>
                  <td className="px-1 py-1"><PmCell id={r.id} initial={r.pm} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="progress_status" initial={r.progress_status} /></td>
                  <td className="px-1 py-1"><EditCell id={r.id} field="confirmed_operator" initial={r.confirmed_operator} /></td>
                  <td className="px-1 py-1">
                    <TappingSummaryCell
                      tappingId={r.id}
                      companyName={r.company_name_snapshot}
                      events={r.events}
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <DeleteRowButton id={r.id} name={r.company_name_snapshot} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({
  children,
  w,
  center,
  right,
  sticky,
}: {
  children?: React.ReactNode;
  w?: number;
  center?: boolean;
  right?: boolean;
  sticky?: boolean;
}) {
  return (
    <th
      className={`font-medium px-2 py-2 whitespace-nowrap ${center ? "text-center" : right ? "text-right" : "text-left"} ${sticky ? "sticky left-0 bg-zinc-50 z-20" : ""}`}
      style={{ width: w, minWidth: w }}
    >
      {children}
    </th>
  );
}

function MiniStat({
  label,
  value,
  suffix,
  tint,
}: {
  label: string;
  value: number;
  suffix?: string;
  tint?: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
      <div className="text-[10.5px] font-medium text-zinc-500 uppercase mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-[22px] font-bold tabular-nums leading-none"
          style={{ color: tint ?? "#1F2A36" }}
        >
          {value}
        </span>
        {suffix ? <span className="text-[11.5px] text-zinc-500">{suffix}</span> : null}
      </div>
    </div>
  );
}
