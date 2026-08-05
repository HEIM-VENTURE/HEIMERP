import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminRepository } from "@/lib/demoday/supabase-repo";
import { createAdminClient } from "@/lib/supabase/admin";
import { EvaluationForm } from "./evaluation-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string; startupId: string }> };

export default async function EvaluatePage({ params }: Props) {
  const { token, startupId } = await params;

  const repo = getAdminRepository();
  const payload = await repo.getSessionPayload(token).catch(() => null);
  if (!payload) redirect("/demoday/j/error");

  const startup = payload.startups.find((s) => s.id === startupId);
  if (!startup) return notFound();

  const existing = await repo
    .getSubmission(payload.round.id, startupId, payload.reviewer.id)
    .catch(() => null);

  // 대표자명 fetch
  let ceoName: string | null = null;
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("companies")
      .select("ceo_name")
      .eq("id", startup.companyId)
      .maybeSingle();
    ceoName = (data as { ceo_name: string | null } | null)?.ceo_name ?? null;
  } catch {
    /* ignore */
  }

  return (
    <div>
      <Link
        href={`/demoday/j/${token}`}
        className="inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-900 mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        참여 기업 목록
      </Link>

      <EvaluationForm
        token={token}
        startup={{
          id: startup.id,
          companyName: startup.companyName,
          companyTagline: startup.companyTagline,
          companyStage: startup.companyStage,
          session: startup.session,
          pitchTime: startup.pitchTime,
          irDeckUrl: startup.irDeckUrl,
          ceoName,
        }}
        existing={
          existing
            ? {
                scores: existing.scores,
                strengths: existing.strengths ?? "",
                concerns: existing.concerns ?? "",
                requests: existing.requests ?? "",
                verdict: existing.verdict,
              }
            : null
        }
      />
    </div>
  );
}
