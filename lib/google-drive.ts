/**
 * Google Drive 폴더 자동 생성 (Apps Script Web App 경유).
 *
 * 환경변수:
 *   - DRIVE_WEBHOOK_URL     Apps Script 배포 URL (/exec)
 *   - DRIVE_WEBHOOK_SECRET  Apps Script 코드에 하드코딩된 SECRET
 */

export type DriveFolderResult =
  | { ok: true; url: string; id: string; existed: boolean }
  | { ok: false; error: string };

export async function createDriveFolderForCompany(
  companyName: string,
): Promise<DriveFolderResult> {
  const url = process.env.DRIVE_WEBHOOK_URL;
  const secret = process.env.DRIVE_WEBHOOK_SECRET;
  if (!url || !secret) {
    return { ok: false, error: "DRIVE_WEBHOOK_URL / DRIVE_WEBHOOK_SECRET 미설정" };
  }

  const name = companyName?.trim();
  if (!name) return { ok: false, error: "companyName required" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, companyName: name }),
      // Apps Script 가 리다이렉트하므로 수동 follow
      redirect: "follow",
      cache: "no-store",
    });
    const text = await res.text();
    let data: { url?: string; id?: string; existed?: boolean; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: `invalid response: ${text.slice(0, 200)}` };
    }
    if (data.error) return { ok: false, error: data.error };
    if (!data.url || !data.id) return { ok: false, error: "missing url/id in response" };
    return { ok: true, url: data.url, id: data.id, existed: !!data.existed };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
