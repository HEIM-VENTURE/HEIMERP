import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HvpNotificationsPage() {
  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-zinc-900">알림</h1>
        <p className="text-sm text-zinc-500 mt-1">담당 기업 단계 변경·결제·정산 알림</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-16 flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4">
          <Bell className="w-7 h-7" />
        </div>
        <div className="text-lg font-semibold text-zinc-900 mb-1">알림 시스템 준비 중</div>
        <p className="text-sm text-zinc-500 text-center max-w-sm">
          담당 기업의 단계 변경·계약 체결·수수료 지급 알림을 이메일과 함께 받아보실 수 있게 준비하고 있습니다.
        </p>
      </div>
    </>
  );
}
