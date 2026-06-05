import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TODO_STATUS_LABELS, SALES_STAGE_LABELS, CONSULTING_STAGE_LABELS } from "@/lib/labels";
import { NewTodoModal } from "./new-todo-modal";
import { TodoCheckbox } from "./todo-checkbox";
import { TodoFilters } from "./todo-filters";

const PM_OPTIONS = ["박대성", "강영환", "기동현", "허유나"];
const STAGE_LABELS: Record<string, string> = {
  ...SALES_STAGE_LABELS,
  ...CONSULTING_STAGE_LABELS,
  hvp_applied: "HVP 신청",
  hvp_paid: "HVP 결제",
};

export const dynamic = "force-dynamic";

type Todo = {
  id: number;
  company_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "done";
  auto_generated: boolean;
  trigger_stage: string | null;
  category: string | null;
  created_at: string;
  completed_at: string | null;
  companies?: {
    id: number;
    name: string;
    hvp_id: string | null;
    custom_fields?: { pm?: string } | null;
  } | null;
};

type Cat = "all" | "hvp_onboarding" | "deal" | "general";

type SearchParams = {
  filter?: "all" | "today" | "overdue" | "this_week" | "done";
  auto?: "all" | "auto" | "manual";
  cat?: Cat;
  pm?: string;
  hvp?: string;
  company?: string;
  stage?: string;
};

const CAT_LABEL: Record<string, string> = {
  hvp_onboarding: "HVP 온보딩",
  deal: "딜·기업",
  general: "일반",
};
const CAT_BADGE: Record<string, string> = {
  hvp_onboarding: "bg-violet-100 text-violet-700", // 보라(브랜드)
  deal: "bg-green-100 text-green-700",             // 초록
  general: "bg-zinc-100 text-zinc-500",            // 회색
};

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  const auto = sp.auto ?? "all";
  const cat = (sp.cat ?? "all") as Cat;
  const pm = sp.pm ?? "all";
  const hvp = sp.hvp ?? "all";
  const company = sp.company ?? "all";
  const stage = sp.stage ?? "all";

  const qs = (over: Partial<{ filter: string; auto: string; cat: string }>) => {
    const p = new URLSearchParams({ filter, auto, cat });
    // 차원 필터(pm/hvp/company/stage)는 보존
    if (pm !== "all") p.set("pm", pm);
    if (hvp !== "all") p.set("hvp", hvp);
    if (company !== "all") p.set("company", company);
    if (stage !== "all") p.set("stage", stage);
    Object.entries(over).forEach(([k, v]) => p.set(k, v as string));
    return `?${p.toString()}`;
  };

  const supabase = await createClient();

  let listQuery = supabase
    .from("todos")
    .select("*, companies(id, name, hvp_id, custom_fields)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const todayStr = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  if (filter === "today") {
    listQuery = listQuery.eq("due_date", todayStr).neq("status", "done");
  } else if (filter === "overdue") {
    listQuery = listQuery.lt("due_date", todayStr).neq("status", "done");
  } else if (filter === "this_week") {
    listQuery = listQuery.lte("due_date", weekStr).neq("status", "done");
  } else if (filter === "done") {
    listQuery = listQuery.eq("status", "done");
  } else {
    listQuery = listQuery.neq("status", "done");
  }

  if (auto === "auto") listQuery = listQuery.eq("auto_generated", true);
  if (auto === "manual") listQuery = listQuery.eq("auto_generated", false);
  if (cat !== "all") listQuery = listQuery.eq("category", cat);
  if (company !== "all") listQuery = listQuery.eq("company_id", Number(company));
  if (stage !== "all") listQuery = listQuery.eq("trigger_stage", stage);

  // 4개 쿼리 동시
  const [listRes, companiesRes, countsRes, hvpsRes] = await Promise.all([
    listQuery,
    supabase.from("companies").select("id, name").order("name", { ascending: true }),
    supabase.from("todos").select("id, due_date, status, auto_generated, category"),
    supabase.from("hvp").select("id, name").order("name", { ascending: true }),
  ]);

  const { data, error } = listRes;
  let list = (data as Todo[]) ?? [];
  // PM·HVP는 연결 기업 기준이라 클라이언트 측에서 필터
  if (pm !== "all") list = list.filter((t) => (t.companies?.custom_fields?.pm ?? "") === pm);
  if (hvp !== "all") list = list.filter((t) => t.companies?.hvp_id === hvp);

  const companies = (companiesRes.data as { id: number; name: string }[]) ?? [];
  const hvpOpts = (hvpsRes.data as { id: string; name: string }[]) ?? [];
  const stageOpts = Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label }));
  const all = (countsRes.data as Todo[]) ?? [];
  const activeAll = all.filter((t) => t.status !== "done");
  const catCount = (c: string) => activeAll.filter((t) => (t.category ?? "deal") === c).length;
  const overdueCount = all.filter((t) => t.status !== "done" && t.due_date && t.due_date < todayStr).length;
  const todayCount = all.filter((t) => t.status !== "done" && t.due_date === todayStr).length;
  const weekCount = all.filter(
    (t) => t.status !== "done" && t.due_date && t.due_date <= weekStr
  ).length;
  const totalActive = all.filter((t) => t.status !== "done").length;
  const doneCount = all.filter((t) => t.status === "done").length;

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">할 일 (To-do)</h1>
          <p className="text-sm text-zinc-500 mt-1">
            전체 {totalActive}개 진행 중 · 단계 변경 시 자동 생성 + 수동 추가
          </p>
        </div>
        <NewTodoModal companies={companies} />
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-4 text-sm border-b border-zinc-200">
        <CatTab active={cat === "all"} href={qs({ cat: "all" })} label="전체" count={activeAll.length} />
        <CatTab active={cat === "hvp_onboarding"} href={qs({ cat: "hvp_onboarding" })} label="HVP 온보딩" count={catCount("hvp_onboarding")} />
        <CatTab active={cat === "deal"} href={qs({ cat: "deal" })} label="딜·기업" count={catCount("deal")} />
        <CatTab active={cat === "general"} href={qs({ cat: "general" })} label="일반" count={catCount("general")} />
      </div>

      {/* 빠른 필터 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <FilterCard active={filter === "overdue"} href={qs({ filter: "overdue" })} label="지난 마감" count={overdueCount} tone="rose" />
        <FilterCard active={filter === "today"} href={qs({ filter: "today" })} label="오늘 마감" count={todayCount} tone="amber" />
        <FilterCard active={filter === "this_week"} href={qs({ filter: "this_week" })} label="이번 주" count={weekCount} tone="blue" />
        <FilterCard active={filter === "all" || !filter} href={qs({ filter: "all" })} label="전체 진행" count={totalActive} tone="zinc" />
        <FilterCard active={filter === "done"} href={qs({ filter: "done" })} label="완료됨" count={doneCount} tone="emerald" />
      </div>

      {/* 다차원 필터 (담당 PM / HVP / 기업 / 단계) */}
      <TodoFilters
        pms={PM_OPTIONS}
        hvps={hvpOpts}
        companies={companies}
        stages={stageOpts}
        current={{ pm, hvp, company, stage }}
      />

      {/* 자동/수동 필터 */}
      <div className="flex gap-2 mb-4 text-xs">
        <FilterPill active={auto === "all" || !auto} href={qs({ auto: "all" })} label="전체" />
        <FilterPill active={auto === "auto"} href={qs({ auto: "auto" })} label="자동 생성만" />
        <FilterPill active={auto === "manual"} href={qs({ auto: "manual" })} label="수동 추가만" />
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      {/* 테이블 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 bg-zinc-50/80 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-3.5 font-medium w-10"></th>
              <th className="text-left px-5 py-3.5 font-medium">제목</th>
              <th className="text-left px-5 py-3.5 font-medium w-40">관련 기업</th>
              <th className="text-left px-5 py-3.5 font-medium w-40">마감일</th>
              <th className="text-left px-5 py-3.5 font-medium w-20">상태</th>
              <th className="text-left px-5 py-3.5 font-medium w-20">출처</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((t) => {
              const dueClass = getDueClass(t.due_date, t.status);
              return (
                <tr key={t.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <TodoCheckbox todoId={t.id} currentStatus={t.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium rounded-full ${CAT_BADGE[t.category ?? "deal"] ?? CAT_BADGE.deal}`}>
                        {CAT_LABEL[t.category ?? "deal"] ?? "딜·기업"}
                      </span>
                      <span className={`${t.status === "done" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                        {t.title}
                      </span>
                    </div>
                    {t.trigger_stage ? (
                      <div className="text-[10px] text-zinc-400 mt-0.5">단계 진입: {t.trigger_stage}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {t.companies ? (
                      <Link
                        href={`/admin/companies/${t.companies.id}`}
                        className="text-zinc-700 hover:text-brand hover:underline"
                      >
                        {t.companies.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {t.due_date ? (
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${dueClass}`}>
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        {t.due_date}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block whitespace-nowrap px-2.5 py-1 text-xs font-medium rounded-full ${
                        t.status === "done"
                          ? "bg-green-100 text-green-700"
                          : t.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {TODO_STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {t.auto_generated ? (
                      <span className="text-amber-700">⚙ 자동</span>
                    ) : (
                      <span className="text-zinc-500">수동</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400">
            {filter === "overdue"
              ? "지난 마감 To-do 없음 👍"
              : filter === "today"
                ? "오늘 마감 To-do 없음 ✨"
                : "To-do 없음"}
          </div>
        ) : null}
      </div>

      <div className="text-xs text-zinc-400 mt-4">
        💡 체크박스 클릭 = 완료 처리 / 우상단 &quot;+ 새 To-do&quot; 버튼으로 직접 추가 가능
      </div>
    </>
  );
}

function CatTab({ active, href, label, count }: { active: boolean; href: string; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 -mb-px border-b-2 font-medium ${
        active ? "border-brand text-brand" : "border-transparent text-zinc-400 hover:text-zinc-700"
      }`}
    >
      {label} <span className="text-xs">{count}</span>
    </Link>
  );
}

function FilterCard({
  active,
  href,
  label,
  count,
  tone,
}: {
  active: boolean;
  href: string;
  label: string;
  count: number;
  tone: "rose" | "amber" | "blue" | "zinc" | "emerald";
}) {
  const tones = {
    rose: "text-rose-600",
    amber: "text-amber-600",
    blue: "text-brand",
    zinc: "text-zinc-900",
    emerald: "text-green-600",
  };
  return (
    <Link
      href={href}
      className={`block bg-white rounded-2xl p-4 transition border ${
        active ? "border-brand ring-2 ring-brand/15" : "border-zinc-200 hover:border-brand/40"
      }`}
    >
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${tones[tone]}`}>{count}</div>
    </Link>
  );
}

function FilterPill({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full ${
        active ? "bg-brand text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {label}
    </Link>
  );
}

function getDueClass(dueDate: string | null, status: string): string {
  if (!dueDate || status === "done") return "text-zinc-500";
  const today = new Date().toISOString().split("T")[0];
  if (dueDate < today) return "text-rose-600 font-medium";
  if (dueDate === today) return "text-amber-600 font-medium";
  return "text-zinc-500";
}
