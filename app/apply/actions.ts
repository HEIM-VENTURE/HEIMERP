"use server";

import { redirect } from "next/navigation";

/**
 * 신청서 제출 server action.
 *
 * Phase 1a (현재): stub. 폼 값 로그만 남기고 감사 페이지로 리다이렉트.
 * Phase 1c (다음): Apps Script Web App URL 로 POST 하고 응답 처리.
 */
export async function submitApplicationAction(formData: FormData) {
  const priorities = formData.getAll("priorities").map(String);
  const irDeck = formData.get("ir_deck") as File | null;
  const businessCert = formData.get("business_cert") as File | null;
  const companyIntro = formData.get("company_intro") as File | null;

  const companyName = String(formData.get("company_name") ?? "").trim();

  const payload = {
    // 기업 정보
    company_name: companyName,
    business_number: String(formData.get("business_number") ?? "").trim(),
    ceo_name: String(formData.get("ceo_name") ?? "").trim(),
    headcount: Number(formData.get("headcount") ?? 0),
    website: String(formData.get("website") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    // 담당자
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_role: String(formData.get("contact_role") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    // 진단
    growth_stage: String(formData.get("growth_stage") ?? ""),
    revenue_range: String(formData.get("revenue_range") ?? ""),
    growth_trend: String(formData.get("growth_trend") ?? ""),
    priorities,
    goals: String(formData.get("goals") ?? "").trim(),
    // 부가
    channel: String(formData.get("channel") ?? ""),
    consent: formData.get("consent") === "on",
    // 파일 (자동 리네이밍 후 저장 예정)
    ir_deck: fileInfo(irDeck),
    business_cert: fileInfo(businessCert, `사업자등록증_${sanitizeFilename(companyName)}`),
    company_intro: fileInfo(companyIntro),
  };

  // 필수 검증
  if (!payload.company_name || !payload.email || !payload.consent) {
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
      "/apply?error=" +
        encodeURIComponent("회사소개서는 20MB 이하만 업로드 가능합니다.")
    );
  }

  // TODO(Phase 1c): Apps Script Web App 으로 POST
  //   - 파일 3종을 base64 인코딩하여 함께 전송
  //   - Apps Script 에서 Sheet 행 추가 + Drive 업로드 + 자동 리네이밍 + 이메일 발송
  console.log("[apply] submission received:", payload);

  redirect("/apply/thanks");
}

// ─────────────────────────────────────────────
// 파일 정보 추출 + 자동 리네이밍 helper
// ─────────────────────────────────────────────
function fileInfo(file: File | null, forcedBaseName?: string) {
  if (!file || file.size === 0) return null;
  const ext = getExt(file.name);
  const finalName = forcedBaseName ? `${forcedBaseName}${ext}` : file.name;
  return {
    original_name: file.name,
    saved_name: finalName,
    size: file.size,
    mime: file.type,
  };
}

function getExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.substring(idx).toLowerCase() : "";
}

// 파일 시스템·URL 안전한 이름으로 변환
function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[\/\\:*?"<>|]/g, "") // 파일시스템 금지 문자
    .replace(/\s+/g, "_") // 공백 → 언더스코어
    .substring(0, 60) || "미상";
}
