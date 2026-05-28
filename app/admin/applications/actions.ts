"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result =
  | { success: true; stage?: string; email?: string; name?: string; alreadyLoggedIn?: boolean }
  | { error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "로그인 필요" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { supabase, error: "관리자 권한 필요" as const };
  return { supabase, error: null };
}

/**
 * 신청서 → HVP 명단 등록 (파트너 단계 진입 시).
 * Google 로그인 방식이므로 Auth 계정/비번은 만들지 않음.
 */
async function registerHvp(
  admin: SupabaseClient,
  app: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    organization: string | null;
    cohort: string | null;
    channel: string | null;
    referrer: string | null;
    created_at: string | null;
    completed_at: string | null;
  }
): Promise<{ hvpId: string; alreadyLoggedIn: boolean } | { error: string }> {
  // 이미 같은 이메일 hvp 있으면 재사용
  const { data: existingHvp } = await admin
    .from("hvp")
    .select("id")
    .ilike("email", app.email)
    .maybeSingle();

  let hvpId: string;
  if (existingHvp) {
    hvpId = existingHvp.id;
  } else {
    const { data: newHvp, error: hvpErr } = await admin
      .from("hvp")
      .insert({
        name: app.name,
        phone: app.phone,
        email: app.email,
        organization: app.organization,
        cohort: app.cohort,
        channel: app.channel,
        referrer: app.referrer,
        applied_at: app.created_at?.split("T")[0] ?? null,
        completed_at: app.completed_at ?? new Date().toISOString().split("T")[0],
        status: "active",
        default_fee_rate: 0.2,
      })
      .select("id")
      .single();
    if (hvpErr || !newHvp) return { error: `HVP 등록 실패: ${hvpErr?.message ?? "알 수 없음"}` };
    hvpId = newHvp.id;
  }

  // 이미 로그인했던 프로필이 있으면 즉시 hvp 승격
  const { data: linked } = await admin
    .from("profiles")
    .update({ role: "hvp", hvp_id: hvpId })
    .ilike("email", app.email)
    .select("id");

  return { hvpId, alreadyLoggedIn: (linked?.length ?? 0) > 0 };
}

/**
 * 온보딩 단계 전진/변경.
 * toStage: applied | paid | completed | partner | rejected
 * payload: 결제(금액·일자) / 이수일 등
 */
export async function updateOnboardingStageAction(
  applicationId: string,
  toStage: "applied" | "paid" | "completed" | "partner" | "rejected",
  payload?: { paidAmount?: number | null; paidAt?: string | null; completedAt?: string | null; reason?: string | null }
): Promise<Result> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { data: app, error: appErr } = await supabase
    .from("hvp_applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (appErr || !app) return { error: "신청서를 찾을 수 없습니다" };

  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  if (toStage === "paid") {
    const { error } = await admin
      .from("hvp_applications")
      .update({
        onboarding_stage: "paid",
        status: "reviewing",
        paid_amount: payload?.paidAmount ?? 150,
        paid_at: payload?.paidAt || today,
      })
      .eq("id", applicationId);
    if (error) return { error: error.message };
  } else if (toStage === "completed") {
    const { error } = await admin
      .from("hvp_applications")
      .update({
        onboarding_stage: "completed",
        status: "reviewing",
        completed_at: payload?.completedAt || today,
      })
      .eq("id", applicationId);
    if (error) return { error: error.message };
  } else if (toStage === "applied") {
    const { error } = await admin
      .from("hvp_applications")
      .update({ onboarding_stage: "applied", status: "new" })
      .eq("id", applicationId);
    if (error) return { error: error.message };
  } else if (toStage === "rejected") {
    const { error } = await admin
      .from("hvp_applications")
      .update({
        onboarding_stage: "rejected",
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        notes: payload?.reason ?? app.notes ?? null,
      })
      .eq("id", applicationId);
    if (error) return { error: error.message };
  } else if (toStage === "partner") {
    if (!app.email) return { error: "이메일이 없어 HVP 등록 불가 (Google 매칭에 필요)" };
    const reg = await registerHvp(admin, app);
    if ("error" in reg) return { error: reg.error };
    const { error } = await admin
      .from("hvp_applications")
      .update({
        onboarding_stage: "partner",
        status: "approved",
        approved_hvp_id: reg.hvpId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);
    if (error) return { error: error.message };

    revalidatePath("/admin/applications");
    revalidatePath("/admin/hvp");
    return {
      success: true,
      stage: "partner",
      email: app.email,
      name: app.name,
      alreadyLoggedIn: reg.alreadyLoggedIn,
    };
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/hvp");
  return { success: true, stage: toStage };
}
