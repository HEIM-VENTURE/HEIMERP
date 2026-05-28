"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * HVP 신청 승인 + HVP 등록.
 * Google 로그인 방식이므로 Auth 계정/비밀번호는 만들지 않는다.
 * 흐름:
 *   1) hvp 테이블 등록(이메일 포함)
 *   2) 같은 이메일로 이미 로그인한 적 있는 프로필이 있으면 즉시 hvp로 승격
 *   3) 아직 로그인 안 했으면 → 본인 Google 계정으로 로그인 시 트리거(0011)가 자동 매칭
 */
export async function approveApplicationAction(applicationId: string) {
  // 1. 관리자 권한 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "관리자 권한 필요" };
  }

  // 2. 신청서 조회
  const { data: app, error: appErr } = await supabase
    .from("hvp_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appErr || !app) {
    return { error: "신청서를 찾을 수 없습니다" };
  }
  if (app.status === "approved") {
    return { error: "이미 승인된 신청서입니다" };
  }
  if (!app.email) {
    return { error: "신청서에 이메일이 없습니다. Google 로그인 자동 매칭에 이메일이 필요해요." };
  }

  const admin = createAdminClient();

  // 3. hvp 테이블에 INSERT (이미 같은 이메일 hvp 있으면 재사용)
  let hvpId: string;
  const { data: existingHvp } = await admin
    .from("hvp")
    .select("id")
    .ilike("email", app.email)
    .maybeSingle();

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
        completed_at: new Date().toISOString().split("T")[0],
        status: "active",
        default_fee_rate: 0.2,
      })
      .select("id")
      .single();

    if (hvpErr || !newHvp) {
      return { error: `HVP 등록 실패: ${hvpErr?.message ?? "알 수 없음"}` };
    }
    hvpId = newHvp.id;
  }

  // 4. 이미 로그인했던 프로필이 있으면 즉시 hvp로 승격 (없으면 트리거가 로그인 시 처리)
  const { data: linkedProfiles } = await admin
    .from("profiles")
    .update({ role: "hvp", hvp_id: hvpId })
    .ilike("email", app.email)
    .select("id");
  const alreadyLoggedIn = (linkedProfiles?.length ?? 0) > 0;

  // 5. 신청서 상태 업데이트
  await admin
    .from("hvp_applications")
    .update({
      status: "approved",
      approved_hvp_id: hvpId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  revalidatePath("/admin/applications");
  revalidatePath("/admin/hvp");

  return {
    success: true,
    hvpId,
    email: app.email,
    name: app.name,
    alreadyLoggedIn,
  };
}

/**
 * HVP 신청 거절
 */
export async function rejectApplicationAction(applicationId: string, reason?: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  if (profile?.role !== "admin") return { error: "관리자 권한 필요" };

  const { error } = await supabase
    .from("hvp_applications")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      notes: reason ?? null,
    })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath("/admin/applications");
  return { success: true };
}
