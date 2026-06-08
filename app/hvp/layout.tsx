import { redirect } from "next/navigation";
import { HvpShell } from "@/components/sidebar/hvp-shell";
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
    <HvpShell profile={profile} hvpInfo={hvpInfo}>
      {children}
    </HvpShell>
  );
}
