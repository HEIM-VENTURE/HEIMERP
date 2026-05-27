import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getField,
  getFieldDate,
  getFieldNumber,
  getResponseId,
  verifyTallySecret,
  type TallyPayload,
} from "@/lib/tally";

/**
 * Tally 폼 1 (기업 접수) Webhook.
 * URL: /api/webhooks/tally/companies?secret=<TALLY_WEBHOOK_SECRET>
 *
 * Tally 폼 필드(라벨):
 *   접수자, 접수자 연락처, 접수자 이메일,
 *   대상회사, 소재지, 대표자명, 연락처, 이메일,
 *   주요 아이템, 설립일자, 직전년도 매출액 (백만원), 접수목적
 */
export async function POST(req: Request) {
  // 1. 보안 검증
  if (!verifyTallySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 페이로드 파싱
  let payload: TallyPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const responseId = getResponseId(payload);
  if (!responseId) {
    return NextResponse.json({ error: "Missing responseId" }, { status: 400 });
  }

  // 3. Service role 클라이언트 (RLS 우회 - webhook은 신뢰된 외부 호출)
  const supabase = createAdminClient();

  // 4. 중복 체크 (같은 responseId는 무시)
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("tally_response_id", responseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, id: existing.id, duplicate: true });
  }

  // 5. 필드 추출 + INSERT
  const insertData = {
    name: getField(payload, "대상회사") ?? "(이름 미입력)",
    address: getField(payload, "소재지"),
    ceo_name: getField(payload, "대표자명"),
    phone: getField(payload, "연락처"),
    email: getField(payload, "이메일"),
    main_item: getField(payload, "주요 아이템"),
    founded_at: getFieldDate(payload, "설립일자"),
    last_year_revenue: getFieldNumber(payload, "직전년도 매출액 (백만원)"),
    inquiry_purpose: getField(payload, "접수목적"),
    submitter_name: getField(payload, "접수자") ?? getField(payload, "접수자 (또는 소개자)"),
    submitter_phone: getField(payload, "접수자 연락처"),
    submitter_email: getField(payload, "접수자 이메일"),
    sales_stage: "received" as const,
    source: "tally_webhook" as const,
    tally_response_id: responseId,
  };

  const { data, error } = await supabase
    .from("companies")
    .insert(insertData)
    .select("id, name")
    .single();

  if (error) {
    console.error("[Tally companies webhook] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    id: data.id,
    name: data.name,
  });
}

// Tally가 가끔 GET으로 health check할 수 있으니 응답
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "tally/companies" });
}
