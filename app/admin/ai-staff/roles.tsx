import { ClipboardCheck, FileBarChart, Mic, Wrench, type LucideIcon } from "lucide-react";

/**
 * AI 직원 업무 분장. 루틴을 켜고 끌 때 status 를 같이 바꾼다.
 * active = 가동 중 / testing = 시험 운영 / planned = 준비 중
 */
export type RoleKey = "daily" | "weekly" | "voice" | "system";
type RoleStatus = "active" | "testing" | "planned";

export const AI_ROLES: {
  key: RoleKey;
  name: string;
  icon: LucideIcon;
  schedule: string;
  status: RoleStatus;
  duties: string[];
  permission: string;
  output: string;
}[] = [
  {
    key: "daily",
    name: "데이터 관리 담당",
    icon: ClipboardCheck,
    schedule: "평일 오전 8:30",
    status: "testing",
    duties: [
      "다음 액션 마감 지남·임박 확인",
      "오래 연락 없는 기업, 관심 표명 후 방치된 투자사 찾기",
      "접수 미처리·지연된 할 일 확인",
      "담당 PM·다음 액션·Drive 폴더 빈 곳, 중복 의심 기업 정리",
    ],
    permission: "근거가 있는 마지막 접촉일만 직접 수정",
    output: "확인이 필요한 것",
  },
  {
    key: "weekly",
    name: "주간 보고 담당",
    icon: FileBarChart,
    schedule: "매주 월요일 오전 8:00",
    status: "testing",
    duties: [
      "지난주 숫자와 비교한 한눈에 요약",
      "지난주 움직임 (새 접수·태핑·주요 메모)",
      "이번 주 챙겨야 할 것과 위험 신호",
      "운영 제안 1~3개",
    ],
    permission: "읽기만 (수정 없음)",
    output: "주간 보고",
  },
  {
    key: "voice",
    name: "회의 기록 담당",
    icon: Mic,
    schedule: "매시간 (음성 메모 정리 후)",
    status: "planned",
    duties: [
      "음성·회의 내용에서 해당 기업 찾기",
      "다음 액션·마감일 갱신, 기업 메모 남기기",
      "투자사 미팅 결과를 태핑 기록에 추가",
      "후속 할 일 등록",
    ],
    permission: "다음 액션·메모·태핑·할 일 직접 기록",
    output: "AI 가 수정한 기록",
  },
  {
    key: "system",
    name: "시스템 관리 담당",
    icon: Wrench,
    schedule: "개선 요청이 들어오면",
    status: "planned",
    duties: [
      "개선 요청함의 요청 검토",
      "ERP 코드 수정 (메뉴 정리·화면 개선·버그)",
      "검토용 제안(PR) 올리고 결과 답변",
    ],
    permission: "코드는 PR 로만 · 승인해야 배포",
    output: "개선 요청함",
  },
];

const STATUS_BADGE: Record<RoleStatus, { label: string; cls: string }> = {
  active: { label: "가동 중", cls: "bg-emerald-100 text-emerald-700" },
  testing: { label: "시험 운영", cls: "bg-blue-100 text-blue-700" },
  planned: { label: "준비 중", cls: "bg-zinc-100 text-zinc-500" },
};

export type RoleStat = { label: string; value: string };

export function RoleCards({ stats }: { stats: Record<RoleKey, RoleStat[]> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {AI_ROLES.map((r) => {
        const Icon = r.icon;
        const badge = STATUS_BADGE[r.status];
        return (
          <section
            key={r.key}
            className={`bg-white border rounded-xl p-4 flex flex-col ${
              r.status === "planned" ? "border-dashed border-zinc-200" : "border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-[14px] font-bold text-zinc-900">{r.name}</div>
                  <div className="text-[11px] text-zinc-500">{r.schedule}</div>
                </div>
              </div>
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-[12px] text-zinc-700 flex-1">
              {r.duties.map((d) => (
                <li key={d} className="flex gap-1.5">
                  <span className="text-brand">·</span>
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-0.5">
              <div>
                <span className="font-semibold text-zinc-600">권한</span> {r.permission}
              </div>
              <div>
                <span className="font-semibold text-zinc-600">결과 보는 곳</span> 아래 &lsquo;{r.output}&rsquo;
              </div>
              {stats[r.key].length > 0 ? (
                <div className="flex flex-wrap gap-x-3 pt-1">
                  {stats[r.key].map((s) => (
                    <span key={s.label}>
                      {s.label} <b className="text-zinc-800 tabular-nums">{s.value}</b>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function RoleTag({ role }: { role: RoleKey }) {
  const r = AI_ROLES.find((x) => x.key === role)!;
  return (
    <span className="ml-2 text-[10.5px] font-normal px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">{r.name}</span>
  );
}
