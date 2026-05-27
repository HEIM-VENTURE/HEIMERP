import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Google Apps Script가 호출할 Webhook.
 * URL: /api/webhooks/google-form/hvp-applications?secret=<TALLY_WEBHOOK_SECRET>
 *
 * 받는 페이로드 (단순 JSON):
 * {
 *   responseId: string,            // 구글 폼 응답 ID (중복 방지)
 *   name: string,                  // 성명
 *   organization: string,          // 소속
 *   phone: string,                 // 연락처
 *   email: string,                 // 이메일
 *   motivation: string,            // HVP 교육프로그램이 필요한 이유
 *   channel: string,               // 유입 경로
 *   referrer: string,              // 추천인
 *   cohort: string                 // 신청 기수
 * }
 */
export async function POST(req: Request) {
  // 보안 검증 (Tally와 같은 시크릿 재사용)
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") ?? req.headers.get("x-webhook-secret");
  if (!process.env.TALLY_WEBHOOK_SECRET || secret !== process.env.TALLY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const responseId = String(body.responseId ?? "");
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
    name: String(body.name ?? "").trim() || "(이름 미입력)",
    organization: body.organization ? String(body.organization).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    email: String(body.email ?? "").trim() || "noemail@example.com",
    motivation: body.motivation ? String(body.motivation).trim() : null,
    channel: body.channel ? String(body.channel).trim() : null,
    referrer: body.referrer ? String(body.referrer).trim() : null,
    cohort: body.cohort ? String(body.cohort).trim() : null,
    source: "google_form",
    tally_response_id: responseId,
  };

  const { data, error } = await supabase
    .from("hvp_applications")
    .insert(insertData)
    .select("id, name")
    .single();

  if (error) {
    console.error("[Google Form hvp-applications webhook] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id, name: data.name });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "google-form/hvp-applications" });
}
