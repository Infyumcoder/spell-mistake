import React, { useEffect, useRef, useState } from 'react';
import Results from './components/Results.jsx';
import { checkSpelling, warmUp } from './utils/spellCheck.js';
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
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [source, setSource] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    warmUp();
  }, []);

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
      let text = '';
      let srcLabel = '';

      if (tab === 'link') {
        if (!url.trim()) throw new Error('Paste a web link first.');
        text = await extractFromUrl(url, setStatus);
        srcLabel = url;
      } else if (tab === 'image') {
        if (!file) throw new Error('Choose an image first.');
        text = await extractFromImage(file, setStatus);
        srcLabel = file.name;
      } else {
        if (!file) throw new Error('Choose a PDF first.');
        text = await extractFromPdf(file, setStatus);
        srcLabel = file.name;
      }

      setStatus('Checking spelling…');
      const result = await checkSpelling(text);
      setReport({ ...result, text });
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
          Drop in a link, an image, or a PDF. Get back every word with a missing letter.
        </p>
      </header>

      <main className="desk">
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
                ref={fileRef}
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
            {busy ? 'Working…' : 'Check spelling'}
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
        Finds words with a missing letter only. Everything runs in your browser — nothing is uploaded.
      </footer>
    </div>
  );
}
