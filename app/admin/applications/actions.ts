"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * HVP 신청 승인 + HVP 등록 + Auth 계정 생성.
 * 한 번 클릭으로 다 처리.
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

  const admin = createAdminClient();

  // 3. hvp 테이블에 INSERT
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

  // 4. Auth 계정 생성 (이메일·임시 비밀번호)
  // 임시 비밀번호: 랜덤 12자
  const tempPassword =
    Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: app.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: app.name },
  });

  if (authErr || !authData?.user) {
    // hvp는 만들어졌으니 status만 업데이트하고 user 정보는 전달
    await admin
      .from("hvp_applications")
      .update({
        status: "approved",
        approved_hvp_id: newHvp.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    revalidatePath("/admin/applications");

    return {
      error: `HVP는 등록됐지만 Auth 계정 생성 실패: ${authErr?.message ?? "알 수 없음"}. 같은 이메일이 이미 있는지 확인하세요.`,
      hvpId: newHvp.id,
    };
  }

  // 5. profiles 업데이트 (trigger가 자동 생성했지만 role/hvp_id 추가)
  // handle_new_user 트리거가 profiles 행을 생성. 잠시 기다린 후 update.
  // 또는 직접 update 시도.
  await admin
    .from("profiles")
    .update({
      role: "hvp",
      hvp_id: newHvp.id,
      name: app.name,
      phone: app.phone,
    })
    .eq("id", authData.user.id);

  // 6. 신청서 상태 업데이트
  await admin
    .from("hvp_applications")
    .update({
      status: "approved",
      approved_hvp_id: newHvp.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  revalidatePath("/admin/applications");

  return {
    success: true,
    hvpId: newHvp.id,
    email: app.email,
    tempPassword,
    name: app.name,
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
