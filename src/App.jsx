import React, { useEffect, useState } from 'react';
import Results from './components/Results.jsx';
import { analyzeDocument, API_KEY_STORAGE_KEY } from './utils/grammarCheck.js';
import { extractFromUrl } from './utils/extractFromUrl.js';
import { extractFromImage } from './utils/extractFromImage.js';
import { extractFromPdf } from './utils/extractFromPdf.js';

const TABS = [
  { id: 'link',  label: 'Link',  hint: 'a web page URL' },
  { id: 'image', label: 'Image', hint: 'a photo or screenshot' },
  { id: 'pdf',   label: 'PDF',   hint: 'a document file' },
];

export default function App() {
  const [tab, setTab] = useState('link');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [source, setSource] = useState('');

  useEffect(() => {
    if (apiKey) localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    else localStorage.removeItem(API_KEY_STORAGE_KEY);
  }, [apiKey]);

  function reset() {
    setError('');
    setReport(null);
    setStatus('');
  }

  function switchTab(id) {
    setTab(id);
    setFile(null);
    reset();
  }

  async function run() {
    reset();
    setBusy(true);
    try {
      if (!apiKey.trim()) throw new Error('Add your Claude API key first.');

      let pages = [];
      let srcLabel = '';

      if (tab === 'link') {
        if (!url.trim()) throw new Error('Paste a web link first.');
        const text = await extractFromUrl(url, setStatus);
        pages = [text];
        srcLabel = url;
      } else if (tab === 'image') {
        if (!file) throw new Error('Choose an image first.');
        const text = await extractFromImage(file, setStatus);
        pages = [text];
        srcLabel = file.name;
      } else {
        if (!file) throw new Error('Choose a PDF first.');
        const extracted = await extractFromPdf(file, setStatus);
        pages = extracted.pages;
        srcLabel = file.name;
      }

      const result = await analyzeDocument(pages, apiKey.trim(), setStatus);
      setReport(result);
      setSource(srcLabel);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  const accept = tab === 'image' ? 'image/*' : 'application/pdf';

  return (
    <div className="page">
      <header className="masthead">
        <div className="wordmark">
          Proof<span className="wordmark-accent">Mark</span>
        </div>
        <p className="tagline">
          Drop in a link, an image, or a PDF. Get back a full Grammarly-style grammar,
          spelling, tone, and readability review — plus a corrected version.
        </p>
      </header>

      <main className="desk">
        <div className="api-key-card">
          <label className="api-key-label" htmlFor="api-key">Claude API key</label>
          <input
            id="api-key"
            type="password"
            className="api-key-input"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
          <span className="api-key-hint">
            Stored only in your browser. Get one at{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>.
          </span>
        </div>

        <div className="tabs" role="tablist" aria-label="Source type">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className="tab"
              data-active={tab === t.id}
              onClick={() => switchTab(t.id)}
            >
              {t.label}
              <span className="tab-hint">{t.hint}</span>
            </button>
          ))}
        </div>

        <div className="input-card">
          {tab === 'link' ? (
            <input
              type="url"
              className="url-input"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => { setUrl(e.target.value); reset(); }}
              onKeyDown={(e) => e.key === 'Enter' && !busy && run()}
            />
          ) : (
            <label className="dropzone" data-has-file={!!file}>
              <input
                type="file"
                accept={accept}
                className="file-hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  reset();
                }}
              />
              <span className="dropzone-icon" aria-hidden="true">
                {tab === 'image' ? '◳' : '▤'}
              </span>
              <span className="dropzone-text">
                {file ? file.name : `Choose ${tab === 'image' ? 'an image' : 'a PDF'} to check`}
              </span>
            </label>
          )}

          <button className="run" onClick={run} disabled={busy}>
            {busy ? 'Working…' : 'Analyze writing'}
          </button>
        </div>

        {status && (
          <div className="status" role="status">
            <span className="status-pulse" aria-hidden="true" />
            {status}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <Results source={source} report={report} />
      </main>

      <footer className="footer">
        Full grammar, spelling, punctuation, tone, and readability review powered by Claude.
        Extraction runs in your browser; extracted text is sent to the Claude API for analysis.
      </footer>
    </div>
  );
}
