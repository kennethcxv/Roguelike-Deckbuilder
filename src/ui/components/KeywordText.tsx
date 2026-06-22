import { Fragment, type ReactNode } from 'react';
import { KEYWORDS } from '../../content';

const KW_BY_NAME = new Map(KEYWORDS.map((k) => [k.name.toLowerCase(), k]));

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const KEYWORD_RE = new RegExp(
  `\\b(${KEYWORDS.map((k) => escapeRe(k.name)).join('|')})\\b`,
  'gi',
);

/** Render rules text, wrapping recognised keywords with hover tooltips. */
export function KeywordText({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  KEYWORD_RE.lastIndex = 0;
  while ((m = KEYWORD_RE.exec(text)) !== null) {
    const word = m[0];
    if (!word) break;
    if (m.index > last) parts.push(<Fragment key={`t${last}`}>{text.slice(last, m.index)}</Fragment>);
    const kw = KW_BY_NAME.get(word.toLowerCase());
    parts.push(
      <span className="kw" key={`k${m.index}`}>
        {word}
        {kw && <span className="kw-tip">{kw.description}</span>}
      </span>,
    );
    last = m.index + word.length;
  }
  if (last < text.length) parts.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
