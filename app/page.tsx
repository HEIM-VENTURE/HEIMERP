import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/heim-logo-square.jpg"
            alt="HEIM VENTURE INVESTMENT"
            width={120}
            height={120}
            className="w-28 h-28 object-contain mb-3"
            priority
          />
          <h1 className="text-lg font-semibold text-zinc-700">ERP 운영 시스템</h1>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-zinc-700 mb-1.5 block">
              이메일
            </Label>
            <Input id="email" type="email" placeholder="name@hvi.kr" />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-zinc-700 mb-1.5 block">
              비밀번호
            </Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full">로그인</Button>

          <div className="pt-5 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 mb-2.5">개발 중 빠른 전환 (역할 미리보기)</p>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/admin/dashboard"
                className="text-center py-2 text-xs bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200 transition"
              >
                관리자
              </Link>
              <Link
                href="/hvp/dashboard"
                className="text-center py-2 text-xs bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200 transition"
              >
                HVP
              </Link>
              <Link
                href="/company/dashboard"
                className="text-center py-2 text-xs bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200 transition"
              >
                기업
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
