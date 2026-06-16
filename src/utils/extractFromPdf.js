import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Pull text out of a PDF, page by page.
// Note: this reads embedded text. Scanned (image-only) PDFs won't have any —
// for those, export a page as an image and use the Image tab instead.
export async function extractFromPdf(file, onProgress) {
  onProgress?.('Opening the PDF…');

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Reading page ${pageNum} of ${pdf.numPages}…`);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  const text = fullText.trim();
  if (!text) {
    throw new Error(
      'No selectable text found. This may be a scanned PDF — try the Image tab instead.'
    );
  }
  return text;
}
