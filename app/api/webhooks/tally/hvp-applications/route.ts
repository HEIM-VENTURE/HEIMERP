import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getField,
  getResponseId,
  verifyTallySecret,
  type TallyPayload,
} from "@/lib/tally";

/**
 * Tally 폼 2 (HVP 마스터코스 신청) Webhook.
 * URL: /api/webhooks/tally/hvp-applications?secret=<TALLY_WEBHOOK_SECRET>
 *
 * Tally 폼 필드(라벨):
 *   성명, 소속, 연락처, 이메일,
 *   HVP 교육프로그램이 필요한 이유,
 *   유입 경로, 추천인
 */
export async function POST(req: Request) {
  if (!verifyTallySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const supabase = createAdminClient();

  // 중복 체크
  const { data: existing } = await supabase
    .from("hvp_applications")
    .select("id")
    .eq("tally_response_id", responseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, id: existing.id, duplicate: true });
  }

  const insertData = {
    name: getField(payload, "성명") ?? "(이름 미입력)",
    organization: getField(payload, "소속"),
    phone: getField(payload, "연락처"),
    email: getField(payload, "이메일") ?? "noemail@example.com",
    motivation: getField(payload, "HVP 교육프로그램이 필요한 이유"),
    channel: getField(payload, "유입 경로"),
    referrer: getField(payload, "추천인"),
    source: "tally_webhook",
    tally_response_id: responseId,
  };

  const { data, error } = await supabase
    .from("hvp_applications")
    .insert(insertData)
    .select("id, name")
    .single();

  if (error) {
    console.error("[Tally hvp-applications webhook] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    id: data.id,
    name: data.name,
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "tally/hvp-applications" });
}
