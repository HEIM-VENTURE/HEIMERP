"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 신청서 제출 server action.
 *
 * Phase 1c (완성): Supabase applications 테이블에 insert + company-files 버킷에 파일 3종 업로드.
 * Phase 1d (다음): admin 검토 후 판정(GO/조건부/자료요청/NO-GO) + 이메일 발송.
 */
export async function submitApplicationAction(formData: FormData) {
  const priorities = formData.getAll("priorities").map(String);
  const irDeck = formData.get("ir_deck") as File | null;
  const businessCert = formData.get("business_cert") as File | null;
  const companyIntro = formData.get("company_intro") as File | null;

  const companyName = String(formData.get("company_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const consent = formData.get("consent") === "on";

  // ─────────────────────────────────────────────
  // 1. 필수 검증
  // ─────────────────────────────────────────────
  if (!companyName || !email || !consent) {
    redirect("/apply?error=" + encodeURIComponent("필수 항목을 모두 입력해주세요."));
  }
  if (priorities.length > 3) {
    redirect(
      "/apply?error=" +
        encodeURIComponent("최우선 해결 과제는 최대 3개까지 선택할 수 있습니다.")
    );
  }
  if (irDeck && irDeck.size > 20 * 1024 * 1024) {
    redirect(
      "/apply?error=" + encodeURIComponent("IR Deck은 20MB 이하만 업로드 가능합니다.")
    );
  }
  if (businessCert && businessCert.size > 5 * 1024 * 1024) {
    redirect(
      "/apply?error=" +
        encodeURIComponent("사업자등록증은 5MB 이하만 업로드 가능합니다.")
    );
  }
  if (companyIntro && companyIntro.size > 20 * 1024 * 1024) {
    redirect(
      "/apply?error=" + encodeURIComponent("회사소개서는 20MB 이하만 업로드 가능합니다.")
    );
  }

  const supabase = createAdminClient();

  // ─────────────────────────────────────────────
  // 2. application_no 를 DB에서 미리 발급받는다 (파일 경로에 필요).
  //     applications INSERT 전에 sequence만 소비.
  // ─────────────────────────────────────────────
  // 스칼라 반환 RPC: data 필드에 곧바로 문자열이 담긴다. .single() 붙이면 파싱 실패로 null.
  const { data: rpcData, error: noErr } = await supabase.rpc("next_application_no");

  if (noErr || typeof rpcData !== "string" || !rpcData) {
    console.error("[apply] application_no 발급 실패", {
      err: noErr,
      data: rpcData,
      dataType: typeof rpcData,
    });
    redirect(
      "/apply?error=" + encodeURIComponent("접수번호 발급 중 오류가 발생했습니다.")
    );
  }
  const applicationNo = rpcData;

  // ─────────────────────────────────────────────
  // 3. 파일 3종을 Storage(company-files 버킷)에 업로드
  // ─────────────────────────────────────────────
  const files: Record<
    "ir_deck" | "business_cert" | "company_intro",
    FileMeta | null
  > = {
    ir_deck: null,
    business_cert: null,
    company_intro: null,
  };

  try {
    if (irDeck && irDeck.size > 0) {
      files.ir_deck = await uploadOne(supabase, applicationNo, "ir_deck", irDeck);
    }
    if (businessCert && businessCert.size > 0) {
      files.business_cert = await uploadOne(
        supabase,
        applicationNo,
        "business_cert",
        businessCert,
        `사업자등록증_${sanitizeFilename(companyName)}`
      );
    }
    if (companyIntro && companyIntro.size > 0) {
      files.company_intro = await uploadOne(
        supabase,
        applicationNo,
        "company_intro",
        companyIntro
      );
    }
  } catch (err) {
    console.error("[apply] 파일 업로드 실패:", err);
    redirect(
      "/apply?error=" + encodeURIComponent("파일 업로드 중 오류가 발생했습니다.")
    );
  }

  // ─────────────────────────────────────────────
  // 4. applications 테이블에 insert
  // ─────────────────────────────────────────────
  const { error: insertErr } = await supabase.from("applications").insert({
    application_no: applicationNo,
    company_name: companyName,
    business_number: nullIfEmpty(String(formData.get("business_number") ?? "").trim()),
    ceo_name: String(formData.get("ceo_name") ?? "").trim(),
    headcount: Number(formData.get("headcount") ?? 0) || 0,
    website: nullIfEmpty(String(formData.get("website") ?? "").trim()),
    tagline: String(formData.get("tagline") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_role: nullIfEmpty(String(formData.get("contact_role") ?? "").trim()),
    email,
    phone: String(formData.get("phone") ?? "").trim(),
    growth_stage: String(formData.get("growth_stage") ?? ""),
    revenue_range: String(formData.get("revenue_range") ?? ""),
    growth_trend: String(formData.get("growth_trend") ?? ""),
    priorities,
    goals: String(formData.get("goals") ?? "").trim(),
    channel: nullIfEmpty(String(formData.get("channel") ?? "")),
    consent,
    files,
  });

  if (insertErr) {
    console.error("[apply] applications insert 실패", {
      code: insertErr.code,
      message: insertErr.message,
      details: insertErr.details,
      hint: insertErr.hint,
    });
    // 업로드된 파일은 그대로 두고 실패 페이지로 (관리자 수동 정리)
    redirect(
      "/apply?error=" +
        encodeURIComponent(`저장 실패: ${insertErr.message}`)
    );
  }

  console.log(`[apply] 접수 완료: ${applicationNo} (${companyName})`);
  redirect(`/apply/thanks?no=${encodeURIComponent(applicationNo)}`);
}

// ─────────────────────────────────────────────
// Storage 업로드 helper
// ─────────────────────────────────────────────
type FileMeta = {
  name: string;
  path: string;
  size_bytes: number;
  mime: string;
};

async function uploadOne(
  supabase: ReturnType<typeof createAdminClient>,
  applicationNo: string,
  kind: "ir_deck" | "business_cert" | "company_intro",
  file: File,
  forcedBaseName?: string
): Promise<FileMeta> {
  const ext = getExt(file.name);
  const savedName = forcedBaseName ? `${forcedBaseName}${ext}` : file.name;
  const safeName = sanitizeFilename(savedName);
  const path = `applications/${applicationNo}/${kind}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("company-files")
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed (${kind}): ${error.message}`);
  }

  return {
    name: savedName,
    path,
    size_bytes: file.size,
    mime: file.type || "application/octet-stream",
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.substring(idx).toLowerCase() : "";
}

function sanitizeFilename(name: string): string {
  return (
    name
      .trim()
      .replace(/[\/\\:*?"<>|]/g, "") // 파일시스템 금지 문자
      .replace(/\s+/g, "_")
      .substring(0, 100) || "미상"
  );
}

function nullIfEmpty(s: string): string | null {
  return s.length === 0 ? null : s;
}
