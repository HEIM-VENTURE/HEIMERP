"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Trash2,
  Phone,
  Users,
  FileText,
  Heart,
  CheckCircle2,
  XCircle,
  PauseCircle,
} from "lucide-react";
import {
  createTappingEvent,
  updateTappingEvent,
  deleteTappingEvent,
  type EventStatus,
} from "./tapping-event-actions";

export type TappingEvent = {
  id: string;
  sequence: number;
  operator: string;
  status: EventStatus;
  contact_date: string | null;
  notes: string | null;
  created_at: string;
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  contacted: "컨택",
  meeting: "미팅",
  reviewing: "검토",
  interested: "관심",
  committed: "확약",
  passed: "거절",
  hold: "보류",
};

export const STATUS_COLOR: Record<EventStatus, { bg: string; text: string; dot: string }> = {
  contacted: { bg: "#F0F1F3", text: "#4B5563", dot: "#9CA3AF" },
  meeting: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  reviewing: { bg: "#EDE9FE", text: "#6D28D9", dot: "#8B5CF6" },
  interested: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  committed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  passed: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  hold: { bg: "#F5F5F4", text: "#57534E", dot: "#78716C" },
};

const STATUS_ICON: Record<EventStatus, React.ComponentType<{ className?: string }>> = {
  contacted: Phone,
  meeting: Users,
  reviewing: FileText,
  interested: Heart,
  committed: CheckCircle2,
  passed: XCircle,
  hold: PauseCircle,
};

/** 표 셀 안 · 최근 태핑 요약 · 클릭 시 패널 오픈 */
export function TappingSummaryCell({
  tappingId,
  companyName,
  events,
}: {
  tappingId: string;
  companyName: string;
  events: TappingEvent[];
}) {
  const [open, setOpen] = useState(false);
  const last = events[events.length - 1];
  const count = events.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left px-2 py-1 rounded hover:bg-zinc-100 transition-colors group min-h-[36px]"
        title="클릭하여 태핑 이력 관리"
      >
        {count === 0 ? (
          <span className="text-[11.5px] text-zinc-400 group-hover:text-brand">
            + 태핑 추가
          </span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold"
              style={{ background: STATUS_COLOR[last.status].bg, color: STATUS_COLOR[last.status].text }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: STATUS_COLOR[last.status].dot }}
              />
              {STATUS_LABEL[last.status]}
            </span>
            <span className="text-[12.5px] font-medium text-zinc-900 truncate max-w-[110px]">
              {last.operator}
            </span>
            {count > 1 ? (
              <span className="text-[10.5px] text-zinc-400 font-mono">+{count - 1}</span>
            ) : null}
          </div>
        )}
      </button>

      {open ? (
        <TappingPanel
          tappingId={tappingId}
          companyName={companyName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function TappingPanel({
  tappingId,
  companyName,
  onClose,
}: {
  tappingId: string;
  companyName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<TappingEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/tapping-events?tappingId=${encodeURIComponent(tappingId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.error) setError(d.error);
        else setEvents(d.events);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("불러오기 실패");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tappingId]);

  const refresh = async () => {
    const r = await fetch(`/api/admin/tapping-events?tappingId=${encodeURIComponent(tappingId)}`);
    const d = await r.json();
    if (!d.error) setEvents(d.events);
    router.refresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase mb-0.5">
              태핑 이력
            </div>
            <div className="text-[16px] font-bold text-zinc-900">{companyName}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {loading ? (
            <div className="text-[12.5px] text-zinc-400">불러오는 중…</div>
          ) : error ? (
            <div className="text-[12.5px] text-rose-600">오류: {error}</div>
          ) : (
            <>
              {events && events.length > 0 ? (
                events.map((e) => (
                  <EventItem key={e.id} event={e} onChanged={refresh} />
                ))
              ) : (
                <div className="text-[12.5px] text-zinc-400 py-4">
                  아직 태핑 기록이 없습니다.
                </div>
              )}

              {adding ? (
                <NewEventForm
                  tappingId={tappingId}
                  nextSeq={(events?.length ?? 0) + 1}
                  onDone={() => {
                    setAdding(false);
                    refresh();
                  }}
                  onCancel={() => setAdding(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-zinc-300 text-[12.5px] font-medium text-zinc-600 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  새 태핑 기록
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventItem({
  event,
  onChanged,
}: {
  event: TappingEvent;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [operator, setOperator] = useState(event.operator);
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [contactDate, setContactDate] = useState(event.contact_date ?? "");
  const [notes, setNotes] = useState(event.notes ?? "");

  const c = STATUS_COLOR[event.status];
  const Icon = STATUS_ICON[event.status];

  const save = () => {
    start(async () => {
      const res = await updateTappingEvent(event.id, {
        operator,
        status,
        contact_date: contactDate,
        notes,
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      setEditing(false);
      await onChanged();
    });
  };

  const remove = () => {
    if (!confirm(`${event.sequence}차 · ${event.operator} 태핑을 삭제하시겠습니까?`)) return;
    start(async () => {
      const res = await deleteTappingEvent(event.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      await onChanged();
    });
  };

  if (editing) {
    return (
      <div className="border border-brand/40 rounded-xl p-3 space-y-2 bg-brand/5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500 shrink-0">{event.sequence}차</span>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="태핑 대상 (예: 코맥스벤처러스)"
            className="flex-1 h-7 px-2 rounded border border-zinc-300 text-[12.5px] focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
            className="h-7 px-2 rounded border border-zinc-300 text-[12px] bg-white cursor-pointer"
          >
            {(Object.keys(STATUS_LABEL) as EventStatus[]).map((k) => (
              <option key={k} value={k}>{STATUS_LABEL[k]}</option>
            ))}
          </select>
          <input
            type="date"
            value={contactDate}
            onChange={(e) => setContactDate(e.target.value)}
            className="h-7 px-2 rounded border border-zinc-300 text-[12px] bg-white"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="메모 (선택)"
          rows={2}
          className="w-full px-2 py-1 rounded border border-zinc-300 text-[12px] focus:outline-none focus:border-brand resize-none"
        />
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-[11.5px] text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> 이 태핑 삭제
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={pending}
              className="h-7 px-2.5 rounded text-[11.5px] text-zinc-600 hover:text-zinc-900"
            >
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="h-7 px-3 rounded bg-brand text-white text-[11.5px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "저장 중" : "저장"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left border border-zinc-200 rounded-xl p-3 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: c.bg, color: c.text }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10.5px] font-mono text-zinc-400">{event.sequence}차</span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0 rounded-full text-[10px] font-semibold"
              style={{ background: c.bg, color: c.text }}
            >
              {STATUS_LABEL[event.status]}
            </span>
            {event.contact_date ? (
              <span className="text-[10.5px] text-zinc-500 tabular-nums">
                {event.contact_date}
              </span>
            ) : null}
          </div>
          <div className="text-[13px] font-semibold text-zinc-900">{event.operator}</div>
          {event.notes ? (
            <div className="text-[11.5px] text-zinc-600 mt-1 whitespace-pre-wrap">
              {event.notes}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function NewEventForm({
  tappingId,
  nextSeq,
  onDone,
  onCancel,
}: {
  tappingId: string;
  nextSeq: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [operator, setOperator] = useState("");
  const [status, setStatus] = useState<EventStatus>("contacted");
  const [contactDate, setContactDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!operator.trim()) return;
    start(async () => {
      const res = await createTappingEvent(tappingId, {
        operator,
        status,
        contact_date: contactDate,
        notes,
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      onDone();
    });
  };

  return (
    <div className="border border-brand/40 rounded-xl p-3 space-y-2 bg-brand/5">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-zinc-500 shrink-0">{nextSeq}차</span>
        <input
          type="text"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          placeholder="태핑 대상 (예: 코맥스벤처러스)"
          autoFocus
          className="flex-1 h-7 px-2 rounded border border-zinc-300 text-[12.5px] focus:outline-none focus:border-brand"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EventStatus)}
          className="h-7 px-2 rounded border border-zinc-300 text-[12px] bg-white cursor-pointer"
        >
          {(Object.keys(STATUS_LABEL) as EventStatus[]).map((k) => (
            <option key={k} value={k}>{STATUS_LABEL[k]}</option>
          ))}
        </select>
        <input
          type="date"
          value={contactDate}
          onChange={(e) => setContactDate(e.target.value)}
          className="h-7 px-2 rounded border border-zinc-300 text-[12px] bg-white"
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="메모 (선택)"
        rows={2}
        className="w-full px-2 py-1 rounded border border-zinc-300 text-[12px] focus:outline-none focus:border-brand resize-none"
      />
      <div className="flex justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-7 px-2.5 rounded text-[11.5px] text-zinc-600 hover:text-zinc-900"
        >
          취소
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !operator.trim()}
          className="h-7 px-3 rounded bg-brand text-white text-[11.5px] font-medium hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "추가 중" : "추가"}
        </button>
      </div>
    </div>
  );
}
