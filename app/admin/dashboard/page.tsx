import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const kpis = [
  { label: "전체 접수 기업", value: "142", delta: "↑ 12 (이번 달)", positive: true },
  { label: "착수(계약완료)", value: "38", delta: "↑ 4 (이번 달)", positive: true },
  { label: "TIPS 선정", value: "11", delta: "전환율 7.7%" },
  { label: "활동 HVP", value: "47", delta: "3·4·5기 누적" },
];

const stages = [
  { name: "접수", count: 42, color: "bg-zinc-400", width: 80 },
  { name: "1차 미팅", count: 28, color: "bg-blue-400", width: 55 },
  { name: "제안", count: 19, color: "bg-amber-400", width: 38 },
  { name: "계약", count: 15, color: "bg-purple-400", width: 30 },
  { name: "착수 (컨설팅 진행 중)", count: 38, color: "bg-emerald-500", width: 70 },
];

const months = [
  { m: "12월", v: 8, h: 35, color: "bg-zinc-200", text: "text-zinc-600" },
  { m: "1월", v: 11, h: 48, color: "bg-zinc-200", text: "text-zinc-600" },
  { m: "2월", v: 14, h: 60, color: "bg-zinc-300", text: "text-zinc-600" },
  { m: "3월", v: 17, h: 75, color: "bg-zinc-400", text: "text-zinc-600" },
  { m: "4월", v: 19, h: 85, color: "bg-zinc-500", text: "text-zinc-600" },
  { m: "5월", v: 22, h: 100, color: "bg-emerald-500", text: "text-emerald-600 font-semibold", highlight: true },
];

const activities = [
  { color: "bg-emerald-500", body: <><span className="text-zinc-900 font-medium">㈜그린텍</span>이 <span className="text-emerald-600 font-medium">착수</span> 단계로 이동 · 김민준</>, time: "10분 전" },
  { color: "bg-blue-500", body: <><span className="text-zinc-900 font-medium">㈜모빌리티랩</span> 1차 미팅 회의록 업로드 · 박지훈</>, time: "1시간 전" },
  { color: "bg-amber-500", body: <>Tally로 신규 접수 · <span className="text-zinc-900 font-medium">㈜바이오넥스</span> · 이서연</>, time: "2시간 전" },
  { color: "bg-purple-500", body: <><span className="text-zinc-900 font-medium">㈜핀테크솔루션</span> 계약 완료 · 수수료 300만원 정산 예정</>, time: "어제" },
  { color: "bg-zinc-300", body: "HVP 6기 신청서 1건 접수", time: "어제" },
];

const todayTodos = [
  { title: "㈜바이오넥스 1차 미팅 일정 잡기", due: "오늘 마감" },
  { title: "HVP 6기 신청 검토", due: "내일" },
  { title: "㈜핀테크솔루션 수수료 지급", due: "5/30" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
          <p className="text-sm text-zinc-500 mt-1">2026년 5월 · 전체 운영 현황</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">기간 ▾</Button>
          <Button>+ 신규 기업</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">{k.label}</div>
            <div className="text-2xl font-bold text-zinc-900">{k.value}</div>
            <div className={`text-xs mt-2 ${k.positive ? "text-emerald-600" : "text-zinc-400"}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 단계별 분포 */}
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">단계별 분포</h2>
            <Link href="/admin/pipeline" className="text-xs text-zinc-500 hover:text-zinc-900">
              칸반 보기 →
            </Link>
          </div>
          <div className="space-y-3">
            {stages.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-600">{s.name}</span>
                  <span className="text-zinc-900 font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color}`} style={{ width: `${s.width}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-zinc-100">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Drop</span>
                <span className="text-zinc-400">23</span>
              </div>
            </div>
          </div>
        </div>

        {/* 월별 신규 접수 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">월별 신규 접수</h2>
            <span className="text-xs text-zinc-400">최근 6개월</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40 mb-3">
            {months.map((mo) => (
              <div key={mo.m} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`text-xs ${mo.text}`}>{mo.v}</div>
                <div className={`w-full ${mo.color} rounded-t`} style={{ height: `${mo.h}%` }} />
                <div className={`text-[10px] ${mo.highlight ? "text-zinc-700 font-medium" : "text-zinc-400"}`}>{mo.m}</div>
              </div>
            ))}
          </div>
          <div className="pt-3 mt-1 border-t border-zinc-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-zinc-400">평균 접수/월</div>
              <div className="text-zinc-900 font-semibold mt-0.5">15.2건</div>
            </div>
            <div>
              <div className="text-zinc-400">전월 대비</div>
              <div className="text-emerald-600 font-semibold mt-0.5">↑ 15.8%</div>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-5">최근 활동</h2>
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.color}`} />
                <div className="flex-1">{a.body}</div>
                <span className="text-xs text-zinc-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘 처리할 일 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">오늘 처리할 일</h2>
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
              {todayTodos.length}
            </span>
          </div>
          <div className="space-y-3">
            {todayTodos.map((t, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Checkbox className="mt-0.5" />
                <div className="flex-1">
                  <div className="text-zinc-900">{t.title}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{t.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
