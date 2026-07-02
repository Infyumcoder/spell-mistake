# ProofMark

A React tool that gives you a full Grammarly-style writing review — grammar,
spelling, punctuation, capitalization, sentence structure, readability, and
tone — for text pulled from a **web link**, an **image**, or a **PDF**.

## How it works

| Source | What happens |
| --- | --- |
| **Link** | Fetches the page and strips out the readable text. |
| **Image** | Reads the text with OCR (Tesseract.js). |
| **PDF** | Pulls the embedded text (pdf.js), page by page. |

Text extraction (OCR / PDF parsing / page fetching) happens entirely in your
browser. The extracted text is then sent to the **Claude API** for analysis,
which returns:

- A list of grammar, spelling, punctuation, capitalization, sentence
  structure, readability, and tone issues, each with an explanation and a
  suggested correction.
- A fully corrected version of the text.
- For marketing pages, ads, landing pages, and sales copy: suggestions to
  improve clarity, conversion potential, professionalism, readability, and
  call-to-action strength.

Multi-page PDFs are analyzed one page at a time, with a combined issue
summary across all pages.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer, and a
[Claude API key](https://console.anthropic.com/settings/keys).

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173) and paste your
API key into the field at the top of the page — it's stored only in your
browser's `localStorage` and sent directly to the Claude API, never to any
other server.

To build a production bundle:

```bash
npm run build
npm run preview
```

## Notes

- **Links:** browsers block many cross-origin fetches. The app tries a direct
  fetch first, then falls back to a public read-only proxy
  (`api.allorigins.win`). Swap it in `src/utils/extractFromUrl.js` if you prefer
  your own proxy or a backend.
- **OCR:** the first image check downloads the English language data (~10 MB)
  from the Tesseract CDN, so it needs an internet connection and takes a moment.
- **Scanned PDFs:** if a PDF is just images of pages, it has no selectable text.
  Export a page as an image and use the **Image** tab instead.
- **API key & privacy:** your extracted text is sent to Anthropic's Claude API
  for analysis. Don't check documents containing sensitive data into a shared
  key/account you don't control.

## Project layout

```
src/
  App.jsx                 main UI, API key input, and the three input tabs
  components/Results.jsx  extracted text, issues, corrected version, copy suggestions
  utils/
    grammarCheck.js        sends extracted text to the Claude API and parses the report
    extractFromUrl.js       read text from a web link
    extractFromImage.js     OCR an image
    extractFromPdf.js       read text from a PDF, page by page
```
