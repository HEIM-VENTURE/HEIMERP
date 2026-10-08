import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAiStaffAuth, runAiActions, type AiAction } from "@/lib/ai-staff";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ACTIONS = 50;

/**
 * POST /api/ai-staff/act
 * body: { source: "daily" | "weekly" | "voice" | "system", actions: [{ type, ... }] }
 * 허용 동작은 lib/ai-staff.ts handlers 참고. 동작별 결과를 배열로 반환 (하나 실패해도 나머지 진행).
 * 인증: Authorization: Bearer <AI_STAFF_TOKEN>
 */
export async function POST(req: Request) {
  const auth = checkAiStaffAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { source?: unknown; actions?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문 필요" }, { status: 400 });
  }
  const source = typeof body.source === "string" ? body.source.slice(0, 40) : "unknown";
  if (!Array.isArray(body.actions) || body.actions.length === 0) {
    return NextResponse.json({ error: "actions 배열 필요" }, { status: 400 });
  }
  if (body.actions.length > MAX_ACTIONS) {
    return NextResponse.json({ error: `한 번에 최대 ${MAX_ACTIONS}개` }, { status: 400 });
  }

  const results = await runAiActions(createAdminClient(), source, body.actions as AiAction[]);
  revalidatePath("/admin/ai-staff");
  revalidatePath("/admin/dashboard");
  return NextResponse.json({ results });
}
