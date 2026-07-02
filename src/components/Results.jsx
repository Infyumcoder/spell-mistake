import React, { useMemo } from 'react';

// Rebuild the original text with misspelled words wrapped so we can draw
// the proofreader's red squiggle under each one.
function MarkedText({ text, issues }) {
  const parts = useMemo(() => {
    if (!issues.length) return [{ type: 'text', value: text }];
    const sorted = [...issues].sort((a, b) => a.index - b.index);
    const out = [];
    let cursor = 0;
    sorted.forEach((issue, i) => {
      const start = issue.index;
      const end = start + issue.word.length;
      if (start > cursor) out.push({ type: 'text', value: text.slice(cursor, start) });
      out.push({ type: 'flag', value: text.slice(start, end), key: i, suggestions: issue.suggestions });
      cursor = end;
    });
    if (cursor < text.length) out.push({ type: 'text', value: text.slice(cursor) });
    return out;
  }, [text, issues]);

  return (
    <p className="marked">
      {parts.map((p, i) =>
        p.type === 'flag' ? (
          <mark
            key={i}
            className="flag"
            title={p.suggestions.length ? `Try: ${p.suggestions.join(', ')}` : 'No suggestion'}
          >
            {p.value}
          </mark>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </p>
  );
}

export default function Results({ source, report }) {
  if (!report) return null;

  const { total, misspelledCount, uniqueIssues } = report;
  const clean = misspelledCount === 0;

  return (
    <section className="results" aria-live="polite">
      <div className="results-head">
        <div className="proofmark" data-clean={clean}>
          <span className="proofmark-count">{misspelledCount}</span>
          <span className="proofmark-label">
            {clean ? 'all clear' : misspelledCount === 1 ? 'word to fix' : 'words to fix'}
          </span>
        </div>
        <div className="results-meta">
          <span>{total.toLocaleString()} words checked</span>
          <span className="dot" aria-hidden="true">·</span>
          <span>from {source}</span>
        </div>
      </div>

      {clean ? (
        <p className="empty">No spelling mistakes found. The text reads clean.</p>
      ) : (
        <>
          <ol className="issue-list">
            {uniqueIssues.map((issue) => (
              <li key={issue.word} className="issue">
                <span className="issue-word">{issue.word}</span>
                {issue.count > 1 && <span className="issue-count">×{issue.count}</span>}
                <span className="issue-arrow" aria-hidden="true">→</span>
                <span className="issue-suggest">
                  {issue.suggestions.length ? issue.suggestions.join(', ') : 'no suggestion'}
                </span>
              </li>
            ))}
          </ol>

          <details className="marked-wrap">
            <summary>Show the text with mistakes marked</summary>
            <MarkedText text={report.text} issues={report.issues} />
          </details>
        </>
      )}
    </section>
  );
}
