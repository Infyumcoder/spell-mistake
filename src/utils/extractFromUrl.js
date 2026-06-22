// CORS proxies tried in order until one works
const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript, svg, head').forEach((el) => el.remove());
  const text = doc.body ? doc.body.innerText || doc.body.textContent || '' : '';
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.text();
}

export async function extractFromUrl(rawUrl, onProgress) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  onProgress?.('Fetching the page…');

  // Try direct fetch first (works if the site allows CORS)
  try {
    const html = await fetchText(url);
    onProgress?.('Reading the text…');
    const text = stripHtml(html);
    if (!text) throw new Error('No readable text found on that page.');
    return text;
  } catch {
    // Direct fetch failed — try each proxy in turn
  }

  for (let i = 0; i < PROXIES.length; i++) {
    onProgress?.(`Trying proxy ${i + 1} of ${PROXIES.length}…`);
    try {
      const html = await fetchText(PROXIES[i](url));
      onProgress?.('Reading the text…');
      const text = stripHtml(html);
      if (!text) throw new Error('No readable text found on that page.');
      return text;
    } catch {
      // try next proxy
    }
  }

  throw new Error(
    'Could not fetch that page. The site may block all external requests.'
  );
}
