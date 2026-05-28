import { Fragment } from "react";

/**
 * 경량 마크다운 렌더러 (회의록 양식 전용 서브셋).
 * 지원: # / ## / ### 헤딩, * 또는 - 불릿, --- 구분선, **볼드**, 일반 문단.
 * 외부 의존성 없이 우리 템플릿이 쓰는 문법만 처리.
 */
export function MarkdownView({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = [...listItems];
    listItems = [];
    blocks.push(
      <ul key={key++} className="list-disc pl-5 space-y-1 my-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-zinc-700 leading-relaxed">
            {renderInline(it)}
          </li>
        ))}
      </ul>
    );
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }
    if (/^-{3,}$/.test(trimmed)) {
      flushList();
      blocks.push(<hr key={key++} className="my-3 border-zinc-200" />);
      continue;
    }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      const content = renderInline(h[2]);
      if (level === 1) {
        blocks.push(
          <h2 key={key++} className="text-lg font-bold text-zinc-900 mt-2 mb-2">
            {content}
          </h2>
        );
      } else if (level === 2) {
        blocks.push(
          <h3 key={key++} className="text-sm font-bold text-zinc-900 mt-3 mb-1.5 pb-1 border-b border-zinc-100">
            {content}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={key++} className="text-sm font-semibold text-zinc-800 mt-2 mb-1">
            {content}
          </h4>
        );
      }
      continue;
    }

    const bullet = trimmed.match(/^[*\-]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }

    // 일반 문단
    flushList();
    blocks.push(
      <p key={key++} className="text-zinc-700 leading-relaxed my-1">
        {renderInline(trimmed)}
      </p>
    );
  }
  flushList();

  return <div className={`text-sm ${className}`}>{blocks}</div>;
}

/** **볼드** 처리 */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <strong key={i} className="font-semibold text-zinc-900">
          {m[1]}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
