import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/demoday/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/demoday/companies?search=<query>
 * 회사명 ILIKE 검색. 데모데이 생성 위저드용.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const search = (request.nextUrl.searchParams.get("search") ?? "").trim();
    const db = createAdminClient();
    let q = db
      .from("companies")
      .select("id, name, ceo_name, main_item, sales_stage, consulting_stage")
      .order("updated_at", { ascending: false })
      .limit(30);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[admin/demoday/companies] error", err);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다" }, { status: 500 });
  }
}
