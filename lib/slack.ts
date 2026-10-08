/**
 * Slack Web API 얇은 wrapper.
 * 환경변수: SLACK_BOT_TOKEN (xoxb-...)
 */

export type SlackBlock = Record<string, unknown>;

/** 메시지 1건 전송. channel 은 "#channel-name" 또는 채널 ID("C01234ABCD") */
export async function postSlackMessage(opts: {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
}): Promise<{ ok: true; ts: string } | { ok: false; error: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "SLACK_BOT_TOKEN 미설정" };

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel: opts.channel,
      text: opts.text,
      blocks: opts.blocks,
      unfurl_links: false,
      unfurl_media: false,
    }),
  });
  const data = (await res.json()) as { ok: boolean; ts?: string; error?: string };
  if (!data.ok) return { ok: false, error: data.error ?? "unknown slack error" };
  return { ok: true, ts: data.ts ?? "" };
}
