import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = fs.readFileSync(".env.local", "utf8");
const map = {};
for (const line of env.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 0) continue;
  map[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
}
const sb = createClient(map["NEXT_PUBLIC_SUPABASE_URL"], map["SUPABASE_SERVICE_ROLE_KEY"], {
  auth: { persistSession: false },
});

async function colExists(table, col) {
  const { error } = await sb.from(table).select(col).limit(1);
  return !error ? "✅ 있음" : `❌ 없음 (${error.message.slice(0, 50)})`;
}

console.log("0015 meetings.ai_todos:", await colExists("meetings", "ai_todos"));
console.log("companies.custom_fields:", await colExists("companies", "custom_fields"));
console.log("hvp_applications.cohort(0009):", await colExists("hvp_applications", "cohort"));
console.log("hvp_applications.onboarding_stage:", await colExists("hvp_applications", "onboarding_stage"));

// storage bucket (0014)
const { data: buckets } = await sb.storage.listBuckets();
console.log(
  "0014 storage bucket 'company-files':",
  (buckets ?? []).some((b) => b.id === "company-files") ? "✅ 있음" : "❌ 없음"
);

// 데이터 카운트
const { count: comp } = await sb.from("companies").select("id", { count: "exact", head: true });
const { count: hvp } = await sb.from("hvp").select("id", { count: "exact", head: true });
const { count: apps } = await sb.from("hvp_applications").select("id", { count: "exact", head: true });
console.log(`데이터: 회사 ${comp} / HVP ${hvp} / 신청서 ${apps}`);
