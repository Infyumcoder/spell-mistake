// Pull readable text out of a web page.
//
// Browsers block most cross-origin page fetches (CORS). We try a direct fetch
// first, and if that fails we fall back to a public read-only proxy. You can
// swap the proxy for your own if you'd rather not depend on a third party.
const PROXY = 'https://api.allorigins.win/raw?url=';

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Drop things that never contain reading content.
  doc.querySelectorAll('script, style, noscript, svg, head').forEach((el) => el.remove());
  const text = doc.body ? doc.body.innerText || doc.body.textContent || '' : '';
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.text();
}

export async function extractFromUrl(rawUrl, onProgress) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  onProgress?.('Fetching the page…');

  let html;
  try {
    html = await fetchText(url);
  } catch {
    onProgress?.('Direct fetch blocked, trying a proxy…');
    html = await fetchText(PROXY + encodeURIComponent(url));
  }

  onProgress?.('Reading the text…');
  const text = stripHtml(html);
  if (!text) throw new Error('No readable text found on that page.');
  return text;
}
