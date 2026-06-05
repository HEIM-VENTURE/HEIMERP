"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { error?: string; success?: boolean; avatarUrl?: string };

const AVATAR_BUCKET = "avatars";

/** 본인 프로필 이름/전화 업데이트 */
export async function updateProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name) return { error: "이름은 비울 수 없어요" };

  const { error } = await supabase
    .from("profiles")
    .update({ name, phone })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/hvp"); // HVP 사이드바 이름 표시
  revalidatePath("/admin"); // admin 사이드바
  return { success: true };
}

/** 본인 프로필 사진 업로드 + avatar_url 갱신 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "이미지를 선택하세요" };
  }
  if (file.size > 5_242_880) {
    return { error: "이미지가 너무 큽니다 (최대 5MB)" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "이미지 파일만 업로드 가능합니다" };
  }

  const admin = createAdminClient();

  // 파일 경로: {user_id}/{timestamp}.{ext}
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      error:
        uploadError.message.includes("Bucket")
          ? "avatars 버킷이 없습니다 — supabase/migrations/0020 을 SQL Editor에서 실행하세요"
          : "업로드 실패: " + uploadError.message,
    };
  }

  // 공개 URL 가져오기
  const { data: publicUrlData } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  // 이전 사진 정리 (있으면)
  const { data: prev } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  if (prev?.avatar_url) {
    // URL → 경로 추출 (.../avatars/<path>)
    const match = String(prev.avatar_url).match(/\/avatars\/(.+)$/);
    if (match) {
      await admin.storage.from(AVATAR_BUCKET).remove([match[1]]);
    }
  }

  // profiles.avatar_url 갱신
  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    await admin.storage.from(AVATAR_BUCKET).remove([path]);
    return {
      error:
        updateError.message.includes("avatar_url")
          ? "profiles.avatar_url 컬럼이 없습니다 — supabase/migrations/0020 을 SQL Editor에서 실행하세요"
          : "프로필 갱신 실패: " + updateError.message,
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/hvp");
  return { success: true, avatarUrl: publicUrl };
}

/** 프로필 사진 제거 */
export async function removeAvatarAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const admin = createAdminClient();

  const { data: prev } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (prev?.avatar_url) {
    const match = String(prev.avatar_url).match(/\/avatars\/(.+)$/);
    if (match) {
      await admin.storage.from(AVATAR_BUCKET).remove([match[1]]);
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/hvp");
  return { success: true };
}
