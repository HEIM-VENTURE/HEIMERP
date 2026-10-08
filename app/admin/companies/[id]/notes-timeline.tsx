"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Trash2, MessageSquarePlus } from "lucide-react";
import {
  createCompanyNote,
  updateCompanyNote,
  deleteCompanyNote,
  toggleCompanyNotePin,
} from "./note-actions";

export type NoteRow = {
  id: string;
  body: string;
  pinned: boolean;
  created_at: string;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
};

/** URL 을 자동 하이퍼링크로 (http:// 또는 https://) */
function renderBody(body: string) {
  const parts: (string | { url: string; label: string })[] = [];
  const re = /(https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) parts.push(body.slice(last, m.index));
    const url = m[0];
    const label = url.replace(/^https?:\/\//, "").replace(/^(www\.)?/, "").slice(0, 40);
    parts.push({ url, label: label.length < url.length - 8 ? `${label}…` : label });
    last = m.index + url.length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <a
        key={i}
        href={p.url}
        target="_blank"
        rel="noreferrer"
        className="text-brand hover:underline break-all"
      >
        {p.label}
      </a>
    )
  );
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function NotesTimeline({
  companyId,
  notes,
  currentUserId,
}: {
  companyId: number;
  notes: NoteRow[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    setError(null);
    start(async () => {
      const res = await createCompanyNote(companyId, text);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
          <MessageSquarePlus className="w-4 h-4 text-brand" />
          담당자 노트
          <span className="text-[10.5px] text-zinc-400 font-normal">
            · {notes.length}건
          </span>
        </h3>
        <span className="text-[10.5px] text-zinc-400">노트 쓰면 '마지막 접촉일' 자동 갱신</span>
      </div>

      {/* 입력 */}
      <div className="mb-4">
        <textarea
          ref={inputRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="예: 대표랑 통화 - 재무제표 다음 주 전달 예정 · https://docs.google.com/..."
          disabled={pending}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none placeholder:text-zinc-300"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10.5px] text-zinc-400">
            Ctrl/⌘ + Enter 로 저장 · 링크 자동 변환
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !body.trim()}
            className="h-7 px-3 rounded-md bg-brand text-white text-[12px] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {pending ? "저장 중" : "노트 추가"}
          </button>
        </div>
        {error ? <div className="text-[11.5px] text-rose-600 mt-1">{error}</div> : null}
      </div>

      {/* 리스트 */}
      {notes.length === 0 ? (
        <div className="text-center text-[12px] text-zinc-400 py-6">
          아직 노트가 없습니다. 첫 메모를 적어주세요.
        </div>
      ) : (
        <div className="space-y-2">
          {pinned.length > 0 ? (
            <>
              {pinned.map((n) => (
                <NoteCard key={n.id} note={n} companyId={companyId} currentUserId={currentUserId} />
              ))}
              <div className="border-t border-dashed border-zinc-200 my-2" />
            </>
          ) : null}
          {unpinned.map((n) => (
            <NoteCard key={n.id} note={n} companyId={companyId} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  companyId,
  currentUserId,
}: {
  note: NoteRow;
  companyId: number;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [pending, start] = useTransition();
  const canEdit = currentUserId && note.author_id === currentUserId;

  const save = () => {
    const text = draft.trim();
    if (!text) return;
    start(async () => {
      const res = await updateCompanyNote(note.id, companyId, text);
      if (res.error) {
        alert(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm("이 노트를 삭제하시겠습니까?")) return;
    start(async () => {
      const res = await deleteCompanyNote(note.id, companyId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  const togglePin = () => {
    start(async () => {
      const res = await toggleCompanyNotePin(note.id, companyId, !note.pinned);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  const authorLabel = note.author_name || note.author_email || "—";
  const initial = (note.author_name || note.author_email || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      className={`rounded-lg px-3 py-2 border ${
        note.pinned ? "bg-amber-50/50 border-amber-200" : "bg-zinc-50/60 border-zinc-100"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* 아바타 */}
        <div className="w-7 h-7 shrink-0 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[11.5px] font-semibold">
          {initial}
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-1.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                autoFocus
                className="w-full px-2 py-1 rounded border border-brand text-[12.5px] focus:outline-none resize-none"
              />
              <div className="flex gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(note.body);
                    setEditing(false);
                  }}
                  disabled={pending}
                  className="h-6 px-2 rounded text-[11px] text-zinc-500 hover:text-zinc-900"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="h-6 px-2.5 rounded bg-brand text-white text-[11px] font-medium hover:opacity-90 disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[12.5px] text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
                {renderBody(note.body)}
              </div>
              <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                <span className="text-[10.5px] text-zinc-400">
                  <span className="font-medium text-zinc-600">{authorLabel}</span>
                  <span className="mx-1">·</span>
                  {timeAgo(note.created_at)}
                  {note.pinned ? (
                    <>
                      <span className="mx-1">·</span>
                      <span className="text-amber-600 font-semibold">📌 고정</span>
                    </>
                  ) : null}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={togglePin}
                    disabled={pending}
                    title={note.pinned ? "고정 해제" : "상단 고정"}
                    className="p-1 rounded hover:bg-white text-zinc-400 hover:text-amber-600"
                  >
                    {note.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </button>
                  {canEdit ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        disabled={pending}
                        className="text-[10.5px] text-zinc-400 hover:text-zinc-900 px-1.5"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={remove}
                        disabled={pending}
                        title="삭제"
                        className="p-1 rounded hover:bg-white text-zinc-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
