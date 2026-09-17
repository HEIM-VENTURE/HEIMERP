import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/tapping-events?tappingId=<uuid>
 * → 해당 태핑의 이벤트 목록 (sequence asc)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tappingId = searchParams.get("tappingId");
  if (!tappingId) return NextResponse.json({ error: "tappingId 필요" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { data, error } = await supabase
    .from("tapping_events")
    .select("id, sequence, operator, status, contact_date, notes, created_at")
    .eq("tapping_id", tappingId)
    .order("sequence", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}
