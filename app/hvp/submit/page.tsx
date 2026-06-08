import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitCompanyAction } from "./actions";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-zinc-900">새 기업 접수</h1>
        <p className="text-sm text-zinc-500 mt-1">
          내가 영업한 스타트업을 등록합니다. 접수 후 관리자가 검토하고 1차 미팅 일정을 잡습니다.
        </p>
      </div>

      <form action={submitCompanyAction} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">회사 정보</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="name" className="text-xs font-medium text-zinc-700 mb-1 block">회사명 *</Label>
              <Input id="name" name="name" required placeholder="㈜OOO" />
            </div>
            <div>
              <Label htmlFor="ceo_name" className="text-xs font-medium text-zinc-700 mb-1 block">대표자명</Label>
              <Input id="ceo_name" name="ceo_name" placeholder="홍길동" />
            </div>
            <div>
              <Label htmlFor="address" className="text-xs font-medium text-zinc-700 mb-1 block">소재지</Label>
              <Input id="address" name="address" placeholder="서울특별시 강남구" />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs font-medium text-zinc-700 mb-1 block">대표 연락처</Label>
              <Input id="phone" name="phone" type="tel" placeholder="010-1234-5678" />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs font-medium text-zinc-700 mb-1 block">대표 이메일</Label>
              <Input id="email" name="email" type="email" placeholder="ceo@example.com" />
            </div>
            <div>
              <Label htmlFor="founded_at" className="text-xs font-medium text-zinc-700 mb-1 block">설립일자</Label>
              <Input id="founded_at" name="founded_at" type="date" />
            </div>
            <div>
              <Label htmlFor="last_year_revenue_eok" className="text-xs font-medium text-zinc-700 mb-1 block">직전년도 매출 (억)</Label>
              <Input id="last_year_revenue_eok" name="last_year_revenue_eok" type="number" min={0} step="0.1" placeholder="예: 1.2" />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">사업 내용</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="main_item" className="text-xs font-medium text-zinc-700 mb-1 block">주요 아이템</Label>
              <Input id="main_item" name="main_item" placeholder="예: AI 기반 헬스케어 SaaS" />
            </div>
            <div>
              <Label htmlFor="inquiry_purpose" className="text-xs font-medium text-zinc-700 mb-1 block">접수 목적</Label>
              <textarea
                id="inquiry_purpose"
                name="inquiry_purpose"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="예: TIPS 컨설팅 / 투자 유치 / 사업계획 컨설팅 등"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-xs font-medium text-zinc-700 mb-1 block">추가 메모 (선택)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="관리자에게 전달할 정보"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
          <Button type="submit">기업 접수</Button>
        </div>

        <p className="text-xs text-zinc-400">
          💡 접수 즉시 관리자에게 알림이 가고, 자동으로 &quot;기수 카톡방 초대&quot; / &quot;신규 검토&quot; To-do가 생성됩니다.
        </p>
      </form>
    </div>
  );
}
