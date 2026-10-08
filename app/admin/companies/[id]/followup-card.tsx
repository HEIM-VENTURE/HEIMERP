"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, ExternalLink, Clock, Target, CheckCircle2 } from "lucide-react";
import { updateCompanyField } from "./actions";

type Props = {
  companyId: number;
  driveUrl: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
  lastContactAt: string | null;
};

export function FollowupCard({
  companyId,
  driveUrl: initialDrive,
  nextAction: initialAction,
  nextActionDue: initialDue,
  lastContactAt: initialContact,
}: Props) {
  const router = useRouter();
  const [drive, setDrive] = useState(initialDrive ?? "");
  const [action, setAction] = useState(initialAction ?? "");
  const [due, setDue] = useState(initialDue ?? "");
  const [contact, setContact] = useState(initialContact ?? "");
  const [editingAction, setEditingAction] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    setDrive(initialDrive ?? "");
    setAction(initialAction ?? "");
    setDue(initialDue ?? "");
    setContact(initialContact ?? "");
  }, [initialDrive, initialAction, initialDue, initialContact]);

  const save = (
    patch: {
      drive_folder_url?: string | null;
      next_action?: string | null;
      next_action_due?: string | null;
      last_contact_at?: string | null;
    },
    onDone?: () => void,
  ) => {
    start(async () => {
      const res = await updateCompanyField(companyId, patch);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      onDone?.();
      router.refresh();
    });
  };

  // 접촉일 뱃지 색
  const daysSinceContact = contact
    ? Math.floor((Date.now() - new Date(contact).getTime()) / 86400000)
    : null;
  const contactTone =
    daysSinceContact == null
      ? "bg-zinc-100 text-zinc-500"
      : daysSinceContact >= 30
      ? "bg-rose-100 text-rose-700"
      : daysSinceContact >= 14
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  // 액션 마감 임박
  const dueTone = (() => {
    if (!due) return "text-zinc-400";
    const d = new Date(due).getTime();
    const diff = Math.floor((d - Date.now()) / 86400000);
    if (diff < 0) return "text-rose-600 font-semibold";
    if (diff <= 3) return "text-amber-600 font-semibold";
    return "text-zinc-700";
  })();

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white border-2 border-brand/20 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900">후속 관리</h3>
        <span className="text-[10px] text-zinc-400">클릭 → 편집</span>
      </div>

      {/* 1. 마지막 접촉일 */}
      <div className="mb-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-zinc-500 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            마지막 접촉
          </span>
          <button
            type="button"
            onClick={() => save({ last_contact_at: todayStr })}
            disabled={pending}
            className="text-[10.5px] text-brand hover:underline inline-flex items-center gap-0.5"
          >
            <CheckCircle2 className="w-3 h-3" /> 오늘 접촉
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            onBlur={() => (contact || null) !== initialContact && save({ last_contact_at: contact || null })}
            disabled={pending}
            className="flex-1 h-7 px-2 rounded border border-zinc-200 text-[12px] bg-white"
          />
          <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${contactTone}`}>
            {daysSinceContact == null ? "기록 없음" : daysSinceContact === 0 ? "오늘" : `${daysSinceContact}일 전`}
          </span>
        </div>
      </div>

      {/* 2. 다음 액션 */}
      <div className="mb-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-zinc-500 inline-flex items-center gap-1">
            <Target className="w-3 h-3" />
            다음 액션
          </span>
          {due ? (
            <span className={`text-[10.5px] tabular-nums ${dueTone}`}>
              마감 {due}
            </span>
          ) : null}
        </div>
        {editingAction ? (
          <div className="space-y-1.5">
            <textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              rows={2}
              autoFocus
              placeholder="예: 다음주 수요일까지 IR Deck 피드백 전달"
              className="w-full px-2 py-1.5 rounded border border-brand text-[12px] focus:outline-none resize-none"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="flex-1 h-7 px-2 rounded border border-zinc-200 text-[11.5px] bg-white"
              />
              <button
                type="button"
                onClick={() =>
                  save(
                    { next_action: action, next_action_due: due || null },
                    () => setEditingAction(false),
                  )
                }
                disabled={pending}
                className="h-7 px-2.5 rounded bg-brand text-white text-[11px] font-medium hover:opacity-90 disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setAction(initialAction ?? "");
                  setDue(initialDue ?? "");
                  setEditingAction(false);
                }}
                disabled={pending}
                className="h-7 px-2 rounded text-[11px] text-zinc-500"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingAction(true)}
            className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-50 transition-colors min-h-[32px]"
          >
            {action ? (
              <span className="text-[12.5px] text-zinc-900 whitespace-pre-wrap">{action}</span>
            ) : (
              <span className="text-[11.5px] text-zinc-400">+ 다음에 할 일 적기</span>
            )}
          </button>
        )}
      </div>

      {/* 3. Drive 폴더 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-zinc-500 inline-flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            Drive 폴더
          </span>
          {drive ? (
            <a
              href={drive}
              target="_blank"
              rel="noreferrer"
              className="text-[10.5px] text-brand hover:underline inline-flex items-center gap-0.5"
            >
              열기 <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : null}
        </div>
        <input
          type="url"
          value={drive}
          onChange={(e) => setDrive(e.target.value)}
          onBlur={() => (drive || null) !== initialDrive && save({ drive_folder_url: drive || null })}
          placeholder="https://drive.google.com/drive/folders/..."
          disabled={pending}
          className="w-full h-7 px-2 rounded border border-zinc-200 text-[11.5px] bg-white truncate"
        />
      </div>
    </div>
  );
}
