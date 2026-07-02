import React from 'react';

function IssueTable({ issues }) {
  return (
    <ol className="issue-list">
      {issues.map((issue, i) => (
        <li key={i} className="issue-card">
          {issue.pageNumber != null && (
            <span className="issue-page">Page {issue.pageNumber}</span>
          )}
          <span className="issue-type" data-type={issue.issueType}>{issue.issueType}</span>
          <div className="issue-row">
            <span className="issue-field-label">Original:</span>
            <span className="issue-original">{issue.originalText}</span>
          </div>
          <div className="issue-row">
            <span className="issue-field-label">Why:</span>
            <span className="issue-explanation">{issue.explanation}</span>
          </div>
          <div className="issue-row">
            <span className="issue-field-label">Fix:</span>
            <span className="issue-fix">{issue.suggestedCorrection}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CopySuggestions({ suggestions }) {
  const fields = [
    ['clarity', 'Clarity'],
    ['conversion', 'Conversion potential'],
    ['professionalism', 'Professionalism'],
    ['readability', 'Readability'],
    ['callToAction', 'Call-to-action strength'],
  ];
  return (
    <dl className="copy-suggestions">
      {fields.map(([key, label]) =>
        suggestions[key] ? (
          <div key={key} className="copy-suggestion">
            <dt>{label}</dt>
            <dd>{suggestions[key]}</dd>
          </div>
        ) : null
      )}
    </dl>
  );
}

export default function Results({ source, report }) {
  if (!report) return null;

  const { pages, isMultiPage, combinedText, combinedCorrectedText, combinedIssues, issueTypeCounts, totalIssues, isMarketingCopy, copySuggestions } = report;
  const clean = totalIssues === 0;

  return (
    <section className="results" aria-live="polite">
      <div className="results-head">
        <div className="proofmark" data-clean={clean}>
          <span className="proofmark-count">{totalIssues}</span>
          <span className="proofmark-label">
            {clean ? 'all clear' : totalIssues === 1 ? 'issue found' : 'issues found'}
          </span>
        </div>
        <div className="results-meta">
          <span>{pages.length} page{pages.length === 1 ? '' : 's'} analyzed</span>
          <span className="dot" aria-hidden="true">·</span>
          <span>from {source}</span>
        </div>
      </div>

      <details className="section-block" open>
        <summary>OCR Extracted Text</summary>
        <p className="block-text">{combinedText}</p>
      </details>

      <div className="section-block">
        <h3 className="section-title">Grammar &amp; Writing Issues Found</h3>
        {clean ? (
          <p className="empty">✓ No grammar, spelling, or readability issues detected.</p>
        ) : isMultiPage ? (
          <>
            <ul className="summary-badges">
              {Object.entries(issueTypeCounts).map(([type, count]) => (
                <li key={type} className="summary-badge">
                  <span>{type}</span>
                  <span className="summary-badge-count">{count}</span>
                </li>
              ))}
            </ul>
            {pages.map((page) => (
              <div key={page.pageNumber} className="page-block">
                <h4 className="page-title">Page {page.pageNumber}</h4>
                {page.issues.length === 0 ? (
                  <p className="empty">✓ No issues detected on this page.</p>
                ) : (
                  <IssueTable issues={page.issues.map((iss) => ({ ...iss, pageNumber: null }))} />
                )}
              </div>
            ))}
          </>
        ) : (
          <IssueTable issues={combinedIssues} />
        )}
      </div>

      <details className="section-block">
        <summary>Corrected Version</summary>
        <p className="block-text">{combinedCorrectedText}</p>
      </details>

      {isMarketingCopy && copySuggestions && (
        <div className="section-block">
          <h3 className="section-title">Copy Improvement Suggestions</h3>
          <CopySuggestions suggestions={copySuggestions} />
        </div>
      )}
    </section>
  );
}
