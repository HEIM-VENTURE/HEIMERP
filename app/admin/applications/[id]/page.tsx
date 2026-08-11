import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Download, Sparkles, Clock, User, Mail, Phone, Globe, Building2 } from "lucide-react";
import {
  GROWTH_STAGE_LABEL,
  REVENUE_LABEL,
  TREND_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_COLOR,
} from "@/lib/mock-applications";
import { getApplication, listReviewers, getCurrentAdmin } from "@/lib/applications";
import { DecisionPanel } from "./decision-panel";
import { AssigneePicker } from "./assignee-picker";
import { MeetingInfoPanel, CustomEmailPanel } from "./extra-email-panels";

export const metadata = { title: "접수 검토 · HEIM ERP" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  const [app, reviewers, me] = await Promise.all([
    getApplication(id),
    listReviewers(),
    getCurrentAdmin(),
  ]);
  if (!app) return notFound();

  // 담당자 id 조회 (mock 타입엔 없어서 raw DB에서 다시 뽑는다 — getApplication이 스냅샷 name만 리턴하므로)
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: reviewerRow } = await supabase
    .from("applications")
    .select("reviewer_id")
    .eq("id", id)
    .maybeSingle();
  const currentReviewerId = (reviewerRow?.reviewer_id as string | null) ?? null;

  // rank 잠금 없음 — admin이면 항상 편집 가능
  const canEdit = Boolean(me);

  const color = STATUS_COLOR[app.status];
  const receivedDate = new Date(app.received_at).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* Breadcrumb */}
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        접수 목록
      </Link>

      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: color.bg, color: color.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color.dot }} />
                {STATUS_LABEL[app.status]}
              </span>
              <span className="font-mono text-[11px] text-zinc-400">{app.application_no}</span>
            </div>
            <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">{app.company_name}</h1>
            <div className="text-[13.5px] text-zinc-600 mt-1.5">{app.tagline}</div>
          </div>
          <dl className="text-right text-[12px] text-zinc-500 space-y-1 shrink-0">
            <div>
              <dt className="inline">접수: </dt>
              <dd className="inline text-zinc-800">{receivedDate}</dd>
            </div>
            <div>
              <dt className="inline">검토 기한: </dt>
              <dd className="inline text-zinc-800">{app.review_deadline}</dd>
            </div>
            <div>
              <dt className="inline">담당: </dt>
              <dd className="inline text-zinc-800">
                {app.reviewer ?? <span className="text-zinc-300">미배정</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 2-column layout: content (left) + review panel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        {/* ────── Left column: 기업 정보 + 자료 ────── */}
        <div className="space-y-5">
          {/* 기업 정보 */}
          <Card>
            <CardHead icon={<Building2 />} title="기업 정보" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Info label="기업명" value={app.company_name} />
              <Info label="사업자등록번호" value={app.business_number ?? "—"} />
              <Info label="대표자" value={app.ceo_name} />
              <Info label="상근 인원" value={`${app.headcount}명`} />
              <Info
                label="홈페이지"
                value={
                  app.website ? (
                    <a href={app.website} target="_blank" rel="noopener" className="text-brand hover:underline inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {app.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Info label="유입경로" value={app.channel ?? "—"} />
            </div>
          </Card>

          {/* 담당자 정보 */}
          <Card>
            <CardHead icon={<User />} title="담당자" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Info label="담당자명" value={`${app.contact_name}${app.contact_role ? ` · ${app.contact_role}` : ""}`} />
              <div />
              <Info
                label="이메일"
                value={
                  <a href={`mailto:${app.email}`} className="text-brand hover:underline inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {app.email}
                  </a>
                }
              />
              <Info
                label="연락처"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 text-zinc-400" />
                    {app.phone}
                  </span>
                }
              />
            </div>
          </Card>

          {/* 진단 정보 */}
          <Card>
            <CardHead icon={<Clock />} title="진단 정보" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Info label="성장 단계" value={GROWTH_STAGE_LABEL[app.growth_stage] ?? app.growth_stage} />
              <Info label="최근 12개월 매출" value={REVENUE_LABEL[app.revenue_range] ?? app.revenue_range} />
              <Info label="6개월 성장 흐름" value={TREND_LABEL[app.growth_trend] ?? app.growth_trend} />
              <Info
                label="최우선 해결 과제"
                value={
                  <div className="flex flex-wrap gap-1.5">
                    {app.priorities.map((p) => (
                      <span
                        key={p}
                        className="inline-block px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px]"
                      >
                        {PRIORITY_LABEL[p] ?? p}
                      </span>
                    ))}
                  </div>
                }
              />
            </div>
            <div className="mt-5 pt-5 border-t border-zinc-100">
              <div className="text-[11.5px] font-medium text-zinc-500 mb-2">
                12개월 목표 · 확인하고 싶은 내용
              </div>
              <div className="text-[13.5px] text-zinc-800 leading-relaxed whitespace-pre-line">
                {app.goals}
              </div>
            </div>
          </Card>

          {/* 첨부 자료 */}
          <Card>
            <CardHead icon={<FileText />} title="첨부 자료" />
            <div className="space-y-2">
              {app.files.ir_deck ? (
                <FileRow file={app.files.ir_deck} kind="IR Deck" required />
              ) : (
                <MissingFile kind="IR Deck" required />
              )}
              {app.files.business_cert ? (
                <FileRow file={app.files.business_cert} kind="사업자등록증" />
              ) : (
                <MissingFile kind="사업자등록증" />
              )}
              {app.files.company_intro ? (
                <FileRow file={app.files.company_intro} kind="회사소개서" />
              ) : (
                <MissingFile kind="회사소개서" />
              )}
            </div>
          </Card>
        </div>

        {/* ────── Right column: AI 요약 + 검토 결정 ────── */}
        <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          {/* AI 요약 */}
          {app.ai_summary ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(65,86,107,0.04) 0%, rgba(229,83,31,0.04) 100%)",
                border: "1px solid #E5E1D8",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: "#E5531F" }} />
                <span className="text-[13px] font-semibold text-zinc-900">AI 기업 요약</span>
                <span className="ml-auto text-[11px] text-zinc-500">
                  Fit score: <b style={{ color: "#41566B" }}>{app.ai_summary.fit_score}/100</b>
                </span>
              </div>
              <div className="space-y-4 text-[13px] leading-relaxed">
                <AiBlock label="사업 모델" text={app.ai_summary.business_model} />
                <AiBlock label="시장" text={app.ai_summary.market} />
                <AiBullets label="강점" items={app.ai_summary.strengths} tone="ok" />
                <AiBullets label="약점" items={app.ai_summary.weaknesses} tone="warn" />
                <AiBullets label="주요 위험" items={app.ai_summary.risks} tone="risk" />
                <div className="pt-3 border-t border-zinc-200/60">
                  <div className="text-[11px] font-semibold uppercase text-zinc-500 mb-1.5">
                    추천 검토의견
                  </div>
                  <div className="text-[13.5px] text-zinc-900 font-medium leading-relaxed">
                    {app.ai_summary.recommendation}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-200/60 text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Gemini flash-lite · 검토 참고용 (사람이 최종 결정)
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "#FAFAF7", border: "1px dashed #D6D0C0" }}
            >
              <Sparkles className="w-6 h-6 mx-auto text-zinc-300 mb-2" />
              <div className="text-[13px] font-medium text-zinc-500 mb-1">AI 요약 대기 중</div>
              <div className="text-[11.5px] text-zinc-400">
                IR Deck 파싱 후 자동 생성 (Phase 2)
              </div>
            </div>
          )}

          {/* Assignee picker */}
          <AssigneePicker
            applicationId={app.id}
            reviewers={reviewers}
            currentReviewerId={currentReviewerId}
            currentReviewerName={app.reviewer}
            canEdit={canEdit}
            isOwner={true}
            meId={me?.id ?? null}
          />

          {/* Decision panel */}
          <DecisionPanel
            applicationId={app.id}
            initialStatus={app.status}
            initialNotes={app.review_notes ?? ""}
            canEdit={canEdit}
          />

          {/* GO 판정된 신청에만: 미팅 안내 이메일 + 추가 메일 발송 */}
          {app.status === "go" && canEdit ? (
            <>
              <MeetingInfoPanel applicationId={app.id} />
              <CustomEmailPanel applicationId={app.id} />
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-zinc-200 rounded-2xl p-5">{children}</div>;
}

function CardHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
      <span className="text-zinc-400 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] font-medium text-zinc-500 mb-1">{label}</div>
      <div className="text-[13.5px] text-zinc-900">{value}</div>
    </div>
  );
}

function FileRow({
  file,
  kind,
  required,
}: {
  file: { name: string; size_mb: number; url: string };
  kind: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 rounded-lg bg-zinc-50 border border-zinc-100 hover:bg-zinc-100/70 transition-colors">
      <div className="w-9 h-9 rounded-md bg-white border border-zinc-200 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-zinc-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-500">{kind}</span>
          {required ? (
            <span className="text-[10px] text-zinc-400">필수</span>
          ) : (
            <span className="text-[10px] text-zinc-400">선택</span>
          )}
        </div>
        <div className="text-[13px] text-zinc-900 font-medium truncate mt-0.5">{file.name}</div>
      </div>
      <div className="text-[11.5px] text-zinc-400 tabular-nums shrink-0">
        {file.size_mb.toFixed(1)} MB
      </div>
      <a
        href={file.url}
        className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-white transition-colors shrink-0"
        title="다운로드"
      >
        <Download className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function MissingFile({ kind, required }: { kind: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-dashed border-zinc-200">
      <div className="w-9 h-9 rounded-md bg-zinc-50 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-zinc-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-400">{kind}</span>
          {required ? (
            <span className="text-[10px] text-rose-500 font-medium">필수 · 미첨부</span>
          ) : (
            <span className="text-[10px] text-zinc-400">선택 · 미첨부</span>
          )}
        </div>
        <div className="text-[12.5px] text-zinc-400 mt-0.5">파일 없음</div>
      </div>
    </div>
  );
}

function AiBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase text-zinc-500 mb-1">
        {label}
      </div>
      <div className="text-zinc-800">{text}</div>
    </div>
  );
}

function AiBullets({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "ok" | "warn" | "risk";
}) {
  const color = {
    ok: "#237A4E",
    warn: "#B57721",
    risk: "#C0343A",
  }[tone];
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase text-zinc-500 mb-1.5">
        {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-zinc-800">
            <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
