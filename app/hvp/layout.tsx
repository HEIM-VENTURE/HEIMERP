import { redirect } from "next/navigation";
import { HvpSidebar } from "@/components/sidebar/hvp-sidebar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HvpLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, role, hvp_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "hvp") {
    redirect("/");
  }

  // HVP 추가 정보 (기수 등)
  let hvpInfo: { name: string; cohort: string | null } | null = null;
  if (profile.hvp_id) {
    const { data } = await supabase
      .from("hvp")
      .select("name, cohort")
      .eq("id", profile.hvp_id)
      .single();
    hvpInfo = data;
  }

  return (
    <div className="flex min-h-screen">
      <HvpSidebar profile={profile} hvpInfo={hvpInfo} />
      <main className="flex-1 px-8 py-7 overflow-x-auto">{children}</main>
    </div>
  );
}
