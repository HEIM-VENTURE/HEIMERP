import { createClient } from "@supabase/supabase-js";

/**
 * Service role key를 사용하는 Supabase admin 클라이언트.
 * RLS를 우회하므로 서버 사이드 코드에서만 사용. 절대 브라우저로 노출 X.
 * auth.admin.createUser() 같은 관리자 API 호출용.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
