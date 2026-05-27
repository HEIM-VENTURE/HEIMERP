import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompanyDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single();

  const { data: allProfiles, error: allErr } = await supabase
    .from("profiles")
    .select("id, email, role")
    .limit(20);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">기업 대시보드</h1>
      <p className="text-sm text-zinc-500 mb-6">
        아직 회사 정보가 연결되어 있지 않습니다. 관리자에게 문의해주세요.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900 mb-6">
        <div className="font-semibold mb-1.5">⚠️ 권한이 &apos;company_member&apos;로 설정되어 있습니다</div>
        <p className="mb-3">
          관리자로 로그인하시려면 Supabase SQL Editor에서 아래 한 줄을 실행해주세요:
        </p>
        <pre className="bg-white border border-amber-200 rounded p-3 text-xs overflow-x-auto">
{`UPDATE profiles SET role = 'admin', name = '하임 관리자'
WHERE email = 'admin@heimvi.com';`}
        </pre>
        <p className="mt-3 text-xs">실행 후 로그아웃 → 다시 로그인하시면 관리자 대시보드로 진입합니다.</p>
      </div>

      <div className="bg-zinc-100 border border-zinc-300 rounded-xl p-5 text-xs font-mono">
        <div className="font-bold mb-3 text-zinc-900 text-sm">🔍 디버그 정보 (개발 중)</div>

        <div className="mb-3">
          <div className="text-zinc-500">현재 로그인된 user.id:</div>
          <div className="text-zinc-900 break-all">{user?.id ?? "(없음)"}</div>
        </div>

        <div className="mb-3">
          <div className="text-zinc-500">현재 로그인된 user.email:</div>
          <div className="text-zinc-900">{user?.email ?? "(없음)"}</div>
        </div>

        <div className="mb-3">
          <div className="text-zinc-500">profile 조회 결과:</div>
          <pre className="text-zinc-900 bg-white p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div className="mb-3">
          <div className="text-zinc-500">profile 조회 에러:</div>
          <div className="text-zinc-900">{profileError ? JSON.stringify(profileError) : "(없음)"}</div>
        </div>

        <div>
          <div className="text-zinc-500">전체 profiles 목록 (RLS 통과한 것만):</div>
          <pre className="text-zinc-900 bg-white p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(allProfiles, null, 2)}
          </pre>
          <div className="text-zinc-500 mt-1">에러: {allErr ? JSON.stringify(allErr) : "없음"}</div>
        </div>
      </div>
    </div>
  );
}
