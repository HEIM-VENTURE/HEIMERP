import { createClient } from "@/lib/supabase/server";
import { NewHvpModal, EditHvpButton } from "./hvp-modals";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "활성",
  training: "교육중",
  applied: "신청",
  inactive: "휴면",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  training: "bg-blue-100 text-blue-700",
  applied: "bg-amber-100 text-amber-700",
  inactive: "bg-zinc-100 text-zinc-500",
};

type Hvp = {
  id: string;
  name: string;
  organization: string | null;
  phone: string | null;
  email: string | null;
  cohort: string | null;
  status: string;
  default_fee_rate: number | null;
  notes: string | null;
};

export default async function AdminHvpPage() {
  const supabase = await createClient();

  const [hvpRes, companiesRes] = await Promise.all([
    supabase.from("hvp").select("*").order("created_at", { ascending: true }),
    supabase.from("companies").select("id, hvp_id, sales_stage"),
  ]);

  const hvps = (hvpRes.data as Hvp[]) ?? [];
  const companies =
    (companiesRes.data as { id: number; hvp_id: string | null; sales_stage: string }[]) ?? [];

  // hvp별 통계 계산
  const statsByHvp = new Map<string, { intro: number; contracted: number }>();
  for (const c of companies) {
    if (!c.hvp_id) continue;
    const s = statsByHvp.get(c.hvp_id) ?? { intro: 0, contracted: 0 };
    s.intro += 1;
    if (c.sales_stage === "contract" || c.sales_stage === "kickoff") s.contracted += 1;
    statsByHvp.set(c.hvp_id, s);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">HVP 관리</h1>
          <p className="text-sm text-zinc-500 mt-1">총 {hvps.length}명</p>
        </div>
        <NewHvpModal />
      </div>

      {hvps.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl text-center py-16 text-sm text-zinc-400">
          등록된 HVP가 없습니다. 우상단 &quot;+ HVP 추가&quot;로 등록하세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hvps.map((h) => {
            const stats = statsByHvp.get(h.id) ?? { intro: 0, contracted: 0 };
            const rate = stats.intro > 0 ? Math.round((stats.contracted / stats.intro) * 100) : 0;
            return (
              <div key={h.id} className="bg-white border border-zinc-200 rounded-xl p-5">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 text-lg truncate">{h.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{h.organization || "소속 미등록"}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLOR[h.status] ?? STATUS_COLOR.inactive}`}
                    >
                      {STATUS_LABEL[h.status] ?? h.status}
                    </span>
                    <EditHvpButton hvp={h} />
                  </div>
                </div>

                {/* 통계 3종 */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Stat value={`${stats.intro}개`} label="소개 기업" tone="text-blue-600" />
                  <Stat value={`${stats.contracted}건`} label="계약 전환" tone="text-emerald-600" />
                  <Stat value={`${rate}%`} label="전환율" tone="text-amber-600" />
                </div>

                {/* 전환율 바 */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                    <span>계약 전환율</span>
                    <span>{rate}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${rate}%` }} />
                  </div>
                </div>

                {/* 연락처 */}
                <div className="flex items-center gap-3 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                  <span className="flex items-center gap-1">
                    <span>📞</span>
                    {h.phone || "-"}
                  </span>
                  <span className="flex items-center gap-1 min-w-0">
                    <span>✉</span>
                    <span className="truncate">{h.email || "-"}</span>
                  </span>
                  {h.cohort ? <span className="ml-auto text-zinc-400">{h.cohort}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="bg-zinc-50 rounded-lg p-2.5 text-center">
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}
