import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/sidebar/logout-button";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, role")
    .eq("id", user.id)
    .single();

  // role이 admin이거나 hvp면 그쪽으로
  if (profile?.role === "admin") redirect("/admin/dashboard");
  if (profile?.role === "hvp") redirect("/hvp/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 min-h-screen bg-white border-r border-zinc-200 px-3 py-5 flex flex-col shrink-0">
        <div className="px-2 mb-7">
          <Image
            src="/heim-logo-horizontal.jpg"
            alt="HEIM VENTURE INVESTMENT"
            width={200}
            height={40}
            className="h-7 w-auto"
            priority
          />
          <div className="text-[10px] text-zinc-400 mt-1.5 ml-0.5">ERP · 기업</div>
        </div>
        <div className="px-3 py-2 text-sm text-zinc-600">내 회사</div>
        <div className="mt-auto pt-4 border-t border-zinc-100 px-2">
          <div className="text-xs mb-2">
            <div className="font-medium text-zinc-900 truncate">{profile?.name ?? user.email}</div>
            <div className="text-zinc-400 truncate">{profile?.email ?? user.email}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-8 py-7">{children}</main>
    </div>
  );
}
