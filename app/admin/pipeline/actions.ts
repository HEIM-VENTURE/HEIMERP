"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDriveFolderForCompany } from "@/lib/google-drive";

type ActionResult = {
  error?: string;
  success?: boolean;
  companyId?: number;
  driveFolderUrl?: string;
  driveWarning?: string;
};

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

function nullIfEmpty(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** 입력은 억(소수 가능), DB는 백만원 단위. × 100 후 반올림. */
function eokToMan(v: FormDataEntryValue | null): number | null {
  const eok = numOrNull(v);
  if (eok == null) return null;
  return Math.round(eok * 100);
}

function pmOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s && s !== "none" ? s : null;
}

/** 쉼표/세미콜론/개행 분리 + 이메일 트림 + 중복 제거 */
function parseEmails(v: FormDataEntryValue | null): string[] {
  const raw = String(v ?? "").trim();
  if (!raw) return [];
  const list = raw
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && /^\S+@\S+\.\S+$/.test(s));
  return Array.from(new Set(list));
}

/** investor_tappings 적격성 UPSERT (companyId 로 기존 레코드 있으면 UPDATE, 아니면 INSERT) */
async function upsertInvestorTapping(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  companyId: number,
  companyName: string,
  lips: string | null,
  tips: string | null,
  pf: string | null,
): Promise<void> {
  // 하나라도 값이 있으면 upsert, 전부 null 이면 skip
  if (!lips && !tips && !pf) return;

  const { data: existing } = await supabase
    .from("investor_tappings")
    .select("id")
    .eq("company_id", companyId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("investor_tappings")
      .update({
        lips_eligible: lips,
        tips_eligible: tips,
        personal_fund_eligible: pf,
      })
      .eq("id", existing.id);
  } else {
    // 신규 - seq 는 max+1
    const { data: last } = await supabase
      .from("investor_tappings")
      .select("seq")
      .order("seq", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const nextSeq = ((last?.seq as number | null) ?? 0) + 1;
    await supabase.from("investor_tappings").insert({
      seq: nextSeq,
      company_id: companyId,
      company_name_snapshot: companyName,
      lips_eligible: lips,
      tips_eligible: tips,
      personal_fund_eligible: pf,
    });
  }
}

export async function createCompanyAction(formData: FormData): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "회사명을 입력하세요" };

  const gradeRaw = String(formData.get("program_grade") ?? "").trim();
  const programGrade = gradeRaw && gradeRaw !== "none" ? gradeRaw : null;

  const portalEmails = parseEmails(formData.get("portal_invite_emails"));

  const insert = {
    name,
    address: nullIfEmpty(formData.get("address")),
    ceo_name: nullIfEmpty(formData.get("ceo_name")),
    phone: nullIfEmpty(formData.get("phone")),
    email: nullIfEmpty(formData.get("email")),
    main_item: nullIfEmpty(formData.get("main_item")),
    founded_at: nullIfEmpty(formData.get("founded_at")),
    // 입력은 억 단위, DB는 백만원 단위로 저장 (× 100)
    last_year_revenue: eokToMan(formData.get("last_year_revenue_eok") ?? formData.get("last_year_revenue")),
    inquiry_purpose: nullIfEmpty(formData.get("inquiry_purpose")),
    proposal_amount: numOrNull(formData.get("proposal_amount")),
    program_grade: programGrade,
    sales_stage: String(formData.get("sales_stage") ?? "received"),
    source: "manual",
    notes: nullIfEmpty(formData.get("notes")),
    custom_fields: pmOrNull(formData.get("pm")) ? { pm: pmOrNull(formData.get("pm")) } : {},
    portal_invite_emails: portalEmails.length > 0 ? portalEmails : null,
    ...(nullIfEmpty(formData.get("received_at")) ? { received_at: nullIfEmpty(formData.get("received_at")) } : {}),
    ...(nullIfEmpty(formData.get("contracted_at")) ? { contracted_at: nullIfEmpty(formData.get("contracted_at")) } : {}),
  };

  const { data, error } = await supabase
    .from("companies")
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };

  // 투자사 태핑 적격성 UPSERT (LIPS/TIPS/개투)
  await upsertInvestorTapping(
    supabase,
    data.id,
    name,
    nullIfEmpty(formData.get("lips_eligible")),
    nullIfEmpty(formData.get("tips_eligible")),
    nullIfEmpty(formData.get("personal_fund_eligible")),
  );

  // 포털 초대 이메일에 매칭되는 기존 사용자가 있으면 소급 매핑
  if (portalEmails.length > 0) {
    try {
      await supabase.rpc("sync_portal_invites");
    } catch {
      /* 서버 함수 없거나 실패해도 신규 가입 시 trigger 가 처리 */
    }
  }

  // Drive 폴더 자동 생성 (체크박스 ON 이면)
  let driveFolderUrl: string | undefined;
  let driveWarning: string | undefined;
  const wantDrive = String(formData.get("create_drive_folder") ?? "").trim() === "on";
  if (wantDrive) {
    const r = await createDriveFolderForCompany(name);
    if (r.ok) {
      driveFolderUrl = r.url;
      await supabase
        .from("companies")
        .update({ drive_folder_url: r.url, drive_folder_id: r.id })
        .eq("id", data.id);
    } else {
      driveWarning = `Drive 폴더 자동 생성 실패: ${r.error}`;
    }
  }

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/companies/${data.id}`);
  return { success: true, companyId: data.id, driveFolderUrl, driveWarning };
}

export async function updateCompanyAction(
  companyId: number,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "회사명을 입력하세요" };

  const gradeRaw = String(formData.get("program_grade") ?? "").trim();
  const programGrade = gradeRaw && gradeRaw !== "none" ? gradeRaw : null;

  // 기존 custom_fields 유지하며 pm만 갱신
  const { data: existing } = await supabase
    .from("companies")
    .select("custom_fields")
    .eq("id", companyId)
    .single();
  const customFields = { ...(existing?.custom_fields ?? {}) };
  const pm = pmOrNull(formData.get("pm"));
  if (pm) customFields.pm = pm;
  else delete customFields.pm;

  const portalEmails = parseEmails(formData.get("portal_invite_emails"));

  const update = {
    name,
    address: nullIfEmpty(formData.get("address")),
    ceo_name: nullIfEmpty(formData.get("ceo_name")),
    phone: nullIfEmpty(formData.get("phone")),
    email: nullIfEmpty(formData.get("email")),
    main_item: nullIfEmpty(formData.get("main_item")),
    founded_at: nullIfEmpty(formData.get("founded_at")),
    // 입력은 억 단위, DB는 백만원 단위로 저장 (× 100)
    last_year_revenue: eokToMan(formData.get("last_year_revenue_eok") ?? formData.get("last_year_revenue")),
    inquiry_purpose: nullIfEmpty(formData.get("inquiry_purpose")),
    proposal_amount: numOrNull(formData.get("proposal_amount")),
    program_grade: programGrade,
    notes: nullIfEmpty(formData.get("notes")),
    custom_fields: customFields,
    portal_invite_emails: portalEmails.length > 0 ? portalEmails : null,
    received_at: nullIfEmpty(formData.get("received_at")),
    contracted_at: nullIfEmpty(formData.get("contracted_at")),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("companies").update(update).eq("id", companyId);
  if (error) return { error: error.message };

  // 투자사 태핑 적격성 UPSERT
  await upsertInvestorTapping(
    supabase,
    companyId,
    name,
    nullIfEmpty(formData.get("lips_eligible")),
    nullIfEmpty(formData.get("tips_eligible")),
    nullIfEmpty(formData.get("personal_fund_eligible")),
  );

  // 포털 초대 이메일 소급 매핑
  if (portalEmails.length > 0) {
    try {
      await supabase.rpc("sync_portal_invites");
    } catch {
      /* ignore */
    }
  }

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  return { success: true, companyId };
}
