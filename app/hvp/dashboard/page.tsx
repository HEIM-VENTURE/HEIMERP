import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const kpis = [
  { label: "내가 데려온 기업", value: "12", delta: "↑ 3 (이번 달)", positive: true },
  { label: "착수 진행", value: "5", delta: "전환율 41.7%" },
  { label: "누적 수수료", value: "1,500", unit: "만원", delta: "지급 완료 1,200만" },
  { label: "예정 수수료", value: "600", unit: "만원", delta: "2건 정산 예정", warning: true },
];

type Company = {
  name: string;
  stage: string;
  stageVariant: "default" | "muted" | "blue" | "amber" | "purple" | "emerald";
  proposal: string;
  fee: string;
  status: string;
  statusTone: string;
  date: string;
};

const stageStyles: Record<Company["stageVariant"], string> = {
  default: "bg-zinc-100 text-zinc-700",
  muted: "bg-zinc-100 text-zinc-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

const companies: Company[] = [
  { name: "㈜그린텍", stage: "착수", stageVariant: "emerald", proposal: "1,500만원", fee: "300만", status: "지급 예정", statusTone: "text-emerald-600", date: "04/12" },
  { name: "㈜에듀랩", stage: "계약", stageVariant: "purple", proposal: "1,000만원", fee: "200만", status: "계약 진행", statusTone: "text-zinc-500", date: "04/28" },
  { name: "㈜핀테크솔루션", stage: "착수", stageVariant: "emerald", proposal: "1,500만원", fee: "300만", status: "지급 완료", statusTone: "text-zinc-400", date: "03/15" },
  { name: "㈜모빌리티랩", stage: "제안", stageVariant: "amber", proposal: "1,500만원", fee: "-", status: "제안서 작성중", statusTone: "text-amber-600", date: "05/08" },
  { name: "㈜헬스링크", stage: "1차미팅", stageVariant: "blue", proposal: "-", fee: "-", status: "5/30 미팅 예정", statusTone: "text-zinc-500", date: "05/20" },
  { name: "㈜로보케어", stage: "접수", stageVariant: "default", proposal: "-", fee: "-", status: "검토 중", statusTone: "text-zinc-500", date: "05/24" },
];

const funnel = [
  { stage: "접수", count: 12, bar: "bg-zinc-200", height: 96 },
  { stage: "1차미팅", count: 10, bar: "bg-blue-300", height: 80 },
  { stage: "제안", count: 7, bar: "bg-amber-300", height: 64 },
  { stage: "계약", count: 5, bar: "bg-purple-300", height: 48 },
  { stage: "착수", count: 5, bar: "bg-emerald-400", height: 48, highlight: true },
];

const notifications = [
  { title: <>㈜그린텍이 <span className="text-emerald-600 font-medium">착수</span>로 이동</>, sub: "수수료 300만원 정산 예정 · 10분 전" },
  { title: "5기 카톡방에 신규 멤버 안내 부탁드립니다", sub: "관리자 알림 · 어제" },
  { title: <span className="text-zinc-500">㈜핀테크솔루션 수수료 지급 완료</span>, sub: "3일 전" },
];

export default function HvpDashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">안녕하세요, 김민준님 👋</h1>
          <p className="text-sm text-zinc-500 mt-1">
            이번 분기 활동 HVP 47명 중 활발히 활동 중이에요
          </p>
        </div>
        <Button>+ 새 기업 접수</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">{k.label}</div>
            <div className="text-2xl font-bold text-zinc-900">
              {k.value}
              {k.unit ? <span className="text-sm font-medium text-zinc-500">{k.unit}</span> : null}
            </div>
            <div
              className={`text-xs mt-2 ${
                k.warning ? "text-amber-600" : k.positive ? "text-emerald-600" : "text-zinc-400"
              }`}
            >
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* 내 기업 리스트 */}
      <div className="bg-white border border-zinc-200 rounded-xl mb-6">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">내 기업</h2>
          <div className="flex gap-2 text-xs">
            <button className="px-2.5 py-1 bg-zinc-900 text-white rounded-md">전체</button>
            <button className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-50 rounded-md">진행중</button>
            <button className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-50 rounded-md">착수</button>
            <button className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-50 rounded-md">Drop</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 bg-zinc-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium">기업명</th>
                <th className="text-left px-6 py-3 font-medium">단계</th>
                <th className="text-left px-6 py-3 font-medium">제안금액</th>
                <th className="text-left px-6 py-3 font-medium">내 수수료</th>
                <th className="text-left px-6 py-3 font-medium">상태</th>
                <th className="text-left px-6 py-3 font-medium">접수일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {companies.map((c) => (
                <tr key={c.name} className="hover:bg-zinc-50 cursor-pointer">
                  <td className="px-6 py-3.5">
                    <Link href="/admin/companies/1" className="font-medium text-zinc-900">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${stageStyles[c.stageVariant]}`}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-zinc-700">{c.proposal}</td>
                  <td className="px-6 py-3.5">
                    {c.fee === "-" ? (
                      <span className="text-zinc-500">- <span className="text-xs">(미확정)</span></span>
                    ) : (
                      <span className="font-semibold text-zinc-900">
                        {c.fee} <span className="text-xs text-zinc-400 font-normal">(20%)</span>
                      </span>
                    )}
                  </td>
                  <td className={`px-6 py-3.5 text-xs ${c.statusTone}`}>{c.status}</td>
                  <td className="px-6 py-3.5 text-zinc-500 text-xs">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 깔때기 + 알림 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-5">전환 깔때기 (내 기업)</h2>
          <div className="flex items-end gap-2">
            {funnel.map((f, i) => (
              <Fragment key={f.stage}>
                <div className="flex-1">
                  <div className={`text-2xl font-bold ${f.highlight ? "text-emerald-600" : "text-zinc-900"}`}>
                    {f.count}
                  </div>
                  <div className={`${f.bar} rounded-t-lg mt-2`} style={{ height: `${f.height}px` }} />
                  <div className="text-xs text-zinc-500 mt-1.5 text-center">{f.stage}</div>
                </div>
                {i < funnel.length - 1 ? (
                  <div className="text-zinc-300 text-xs pb-12">▶</div>
                ) : null}
              </Fragment>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 grid grid-cols-3 gap-4 text-center text-xs">
            <div><span className="text-zinc-400">접수→1차</span> <span className="text-zinc-900 font-medium ml-1">83%</span></div>
            <div><span className="text-zinc-400">1차→계약</span> <span className="text-zinc-900 font-medium ml-1">50%</span></div>
            <div><span className="text-zinc-400">계약→착수</span> <span className="text-zinc-900 font-medium ml-1">100%</span></div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-zinc-900">알림</h2>
            <Link href="/hvp/notifications" className="text-xs text-zinc-500 hover:text-zinc-900">전체</Link>
          </div>
          <div className="space-y-3.5">
            {notifications.map((n, i) => (
              <div key={i} className={`text-sm ${i > 0 ? "border-t border-zinc-100 pt-3.5" : ""}`}>
                <div className="text-zinc-900">{n.title}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{n.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
