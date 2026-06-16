import Tesseract from 'tesseract.js';

// Run OCR on an image file and return the recognized text.
// Language data is downloaded from the Tesseract CDN on first use.
export async function extractFromImage(file, onProgress) {
  onProgress?.('Reading the image…');

  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(`Recognizing text… ${Math.round(m.progress * 100)}%`);
      } else if (m.status) {
        onProgress?.(m.status.charAt(0).toUpperCase() + m.status.slice(1) + '…');
      }
    },
  });

  const text = (data.text || '').trim();
  if (!text) throw new Error('Could not read any text from that image.');
  return text;
}
