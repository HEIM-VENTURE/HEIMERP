import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import {
  getReviewerSessionFromCookies,
  setReviewerSessionInCookies,
} from "@/lib/demoday/api-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "데모데이 평가 · HEIM Venture Investment" };

type Props = {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
};

export default async function EvaluatorLayout({ children, params }: Props) {
  const { token } = await params;

  // 세션 부트스트랩: 세션이 없거나 다른 토큰이면 URL 토큰으로 재발급.
  const existing = await getReviewerSessionFromCookies();
  let reviewerName: string | null = null;
  let roundTitle: string | null = null;
  let roundDate: string | null = null;

  try {
    const repo = getAdminRepository();
    if (!existing || existing.inviteToken !== token) {
      const invite = await repo.getInviteByToken(token);
      if (!invite) redirect("/demoday/j/error");
      const round = await repo.getRoundById(invite.roundId);
      if (!round) redirect("/demoday/j/error");
      await setReviewerSessionInCookies({
        reviewerId: invite.reviewerId,
        roundId: invite.roundId,
        inviteToken: invite.token,
        issuedAt: Date.now(),
      });
      reviewerName = invite.reviewer.name;
      roundTitle = round.title;
      roundDate = round.date;
    } else {
      // 세션에 정보 없으므로 표시용으로 다시 fetch
      const payload = await repo.getSessionPayload(token);
      if (!payload) redirect("/demoday/j/error");
      reviewerName = payload.reviewer.name;
      roundTitle = payload.round.title;
      roundDate = payload.round.date;
    }
  } catch (err) {
    console.error("[demoday/j layout] bootstrap error", err);
    redirect("/demoday/j/error");
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FBFAF5" }}>
      <header
        className="border-b sticky top-0 z-10"
        style={{
          background: "rgba(255,255,255,0.9)",
          borderColor: "#E8E4DA",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto max-w-md px-4 py-3 flex items-center gap-3">
          <Link href={`/demoday/j/${token}`} className="relative h-7 w-28 shrink-0 block">
            <Image
              src="/heim-logo-mark.png"
              alt="HEIM VENTURE INVESTMENT"
              fill
              sizes="112px"
              priority
              className="object-contain object-left"
            />
          </Link>
          <div className="flex-1 min-w-0 text-right">
            <div className="text-[12px] font-semibold text-zinc-900 truncate">
              {roundTitle ?? "데모데이"}
            </div>
            <div className="text-[10.5px] text-zinc-500">
              {roundDate ?? ""}
              {reviewerName ? ` · ${reviewerName}` : ""}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5 pb-24">{children}</main>

      <footer
        className="border-t py-4 text-center text-[11px] text-zinc-500"
        style={{ borderColor: "#E8E4DA" }}
      >
        HEIM VENTURE INVESTMENT · admin@heimvi.com
      </footer>
    </div>
  );
}
