# ProofMark

A React tool that finds spelling mistakes in text pulled from a **web link**, an
**image**, or a **PDF** — and shows you exactly which words are wrong, with
suggestions. Everything runs in the browser; nothing is uploaded to a server.

## How it works

| Source | What happens |
| --- | --- |
| **Link** | Fetches the page and strips out the readable text. |
| **Image** | Reads the text with OCR (Tesseract.js). |
| **PDF** | Pulls the embedded text (pdf.js). |

The extracted text is checked against an open English Hunspell dictionary
(`nspell` + `dictionary-en`). Misspelled words get a red squiggle and a list of
suggested corrections.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

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
- **Other languages:** swap `dictionary-en` for another
  [`dictionary-*`](https://github.com/wooorm/dictionaries) package (and change
  the OCR language code in `extractFromImage.js`) to check a different language.

## Project layout

```
src/
  App.jsx                 main UI + the three input tabs
  components/Results.jsx  the marked-up text and the list of fixes
  utils/
    spellCheck.js         dictionary loading + word checking
    extractFromUrl.js     read text from a web link
    extractFromImage.js   OCR an image
    extractFromPdf.js     read text from a PDF
```
