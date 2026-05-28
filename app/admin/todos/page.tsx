import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TODO_STATUS_LABELS } from "@/lib/labels";
import { NewTodoModal } from "./new-todo-modal";
import { TodoCheckbox } from "./todo-checkbox";

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
  created_at: string;
  completed_at: string | null;
  companies?: { id: number; name: string } | null;
};

type SearchParams = {
  filter?: "all" | "today" | "overdue" | "this_week" | "done";
  auto?: "all" | "auto" | "manual";
};

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  const auto = sp.auto ?? "all";

  const supabase = await createClient();

  let listQuery = supabase
    .from("todos")
    .select("*, companies(id, name)")
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

  // 3개 쿼리 동시
  const [listRes, companiesRes, countsRes] = await Promise.all([
    listQuery,
    supabase.from("companies").select("id, name").order("name", { ascending: true }),
    supabase.from("todos").select("id, due_date, status, auto_generated"),
  ]);

  const { data, error } = listRes;
  const list = (data as Todo[]) ?? [];
  const companies = (companiesRes.data as { id: number; name: string }[]) ?? [];
  const all = (countsRes.data as Todo[]) ?? [];
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

      {/* 빠른 필터 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <FilterCard active={filter === "overdue"} href="?filter=overdue" label="지난 마감" count={overdueCount} tone="rose" />
        <FilterCard active={filter === "today"} href="?filter=today" label="오늘 마감" count={todayCount} tone="amber" />
        <FilterCard active={filter === "this_week"} href="?filter=this_week" label="이번 주" count={weekCount} tone="blue" />
        <FilterCard active={filter === "all" || !filter} href="?filter=all" label="전체 진행" count={totalActive} tone="zinc" />
        <FilterCard active={filter === "done"} href="?filter=done" label="완료됨" count={doneCount} tone="emerald" />
      </div>

      {/* 자동/수동 필터 */}
      <div className="flex gap-2 mb-4 text-xs">
        <FilterPill active={auto === "all" || !auto} href={`?filter=${filter}&auto=all`} label="전체" />
        <FilterPill active={auto === "auto"} href={`?filter=${filter}&auto=auto`} label="자동 생성만" />
        <FilterPill active={auto === "manual"} href={`?filter=${filter}&auto=manual`} label="수동 추가만" />
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 mb-4">
          {error.message}
        </div>
      ) : null}

      {/* 테이블 */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 bg-zinc-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-10"></th>
              <th className="text-left px-4 py-3 font-medium">제목</th>
              <th className="text-left px-4 py-3 font-medium w-40">관련 기업</th>
              <th className="text-left px-4 py-3 font-medium w-28">마감일</th>
              <th className="text-left px-4 py-3 font-medium w-20">상태</th>
              <th className="text-left px-4 py-3 font-medium w-20">출처</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((t) => {
              const dueClass = getDueClass(t.due_date, t.status);
              return (
                <tr key={t.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <TodoCheckbox todoId={t.id} currentStatus={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className={`${t.status === "done" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                      {t.title}
                    </div>
                    {t.trigger_stage ? (
                      <div className="text-[10px] text-zinc-400 mt-0.5">단계 진입: {t.trigger_stage}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {t.companies ? (
                      <Link
                        href={`/admin/companies/${t.companies.id}`}
                        className="text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        {t.companies.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-xs ${dueClass}`}>
                    {t.due_date ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded ${
                        t.status === "done"
                          ? "bg-emerald-100 text-emerald-700"
                          : t.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {TODO_STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
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
    blue: "text-blue-600",
    zinc: "text-zinc-900",
    emerald: "text-emerald-600",
  };
  return (
    <Link
      href={href}
      className={`block bg-white rounded-xl p-4 transition border ${
        active ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200 hover:border-zinc-400"
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
        active ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
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
