// Sends extracted text to the Claude API for a full Grammarly-style analysis:
// grammar, spelling, punctuation, capitalization, sentence structure,
// readability, tone, and (for marketing-style copy) conversion suggestions.

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

export const API_KEY_STORAGE_KEY = 'proofmark_claude_api_key';

export class GrammarCheckError extends Error {}

const SYSTEM_PROMPT = `You are an expert English editor, proofreader, Grammarly-style grammar checker, and professional copy editor.

You are given one page of text that was already extracted (via OCR, PDF text extraction, or a web page fetch) from a document. Analyze it for:
- Grammar mistakes
- Spelling mistakes
- Punctuation issues
- Capitalization errors
- Sentence structure problems
- Readability issues
- Tone inconsistencies
- Awkward or unnatural wording

Respond with ONLY a single valid JSON object — no markdown code fences, no commentary before or after — with exactly this shape:
{
  "issues": [
    {
      "originalText": string,
      "issueType": "Grammar" | "Spelling" | "Punctuation" | "Capitalization" | "Sentence Structure" | "Readability" | "Tone" | "Wording",
      "explanation": string,
      "suggestedCorrection": string
    }
  ],
  "correctedText": string,
  "isMarketingCopy": boolean,
  "copySuggestions": {
    "clarity": string,
    "conversion": string,
    "professionalism": string,
    "readability": string,
    "callToAction": string
  } | null
}

Rules:
- "issues" must be an empty array if the text has no mistakes at all.
- "correctedText" is the full text rewritten with every issue fixed, preserving the original structure, headings, bullet points, and line breaks as closely as plain text allows.
- Set "isMarketingCopy" to true only for marketing pages, landing pages, ads, sales emails, or social media posts, and in that case give concrete, specific suggestions in "copySuggestions" (not generic advice). Otherwise set "copySuggestions" to null.
- Never omit, summarize, or truncate the text.
- Output must be valid JSON parseable by JSON.parse — no markdown fences, no trailing commentary.`;

function extractJson(raw) {
  const trimmed = (raw || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
    throw new GrammarCheckError('The AI response was not valid JSON.');
  }
}

async function analyzePage(text, apiKey) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    });
  } catch {
    throw new GrammarCheckError('Could not reach the Claude API. Check your connection.');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error?.message || '';
    } catch {
      // ignore
    }
    if (res.status === 401) throw new GrammarCheckError('Invalid Claude API key.');
    throw new GrammarCheckError(detail || `Grammar check request failed (${res.status}).`);
  }

  const data = await res.json();
  const raw = data?.content?.find((block) => block.type === 'text')?.text || '';
  const parsed = extractJson(raw);

  return {
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    correctedText: typeof parsed.correctedText === 'string' ? parsed.correctedText : text,
    isMarketingCopy: !!parsed.isMarketingCopy,
    copySuggestions: parsed.copySuggestions || null,
  };
}

// pages: array of page-text strings (one entry for images/links, one per page for PDFs)
export async function analyzeDocument(pages, apiKey, onProgress) {
  if (!apiKey) throw new GrammarCheckError('Add your Claude API key first.');

  const cleanPages = (pages || []).map((p) => (p || '').trim()).filter(Boolean);
  if (!cleanPages.length) throw new GrammarCheckError('No text to analyze.');

  const results = [];
  for (let i = 0; i < cleanPages.length; i++) {
    onProgress?.(
      cleanPages.length > 1
        ? `Analyzing page ${i + 1} of ${cleanPages.length}…`
        : 'Analyzing grammar, tone, and readability…'
    );
    const analyzed = await analyzePage(cleanPages[i], apiKey);
    results.push({ pageNumber: i + 1, extractedText: cleanPages[i], ...analyzed });
  }

  const isMultiPage = results.length > 1;
  const combinedIssues = results.flatMap((r) =>
    r.issues.map((issue) => ({ ...issue, pageNumber: isMultiPage ? r.pageNumber : null }))
  );

  const issueTypeCounts = combinedIssues.reduce((acc, issue) => {
    const type = issue.issueType || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    pages: results,
    isMultiPage,
    combinedText: results.map((r) => r.extractedText).join('\n\n'),
    combinedCorrectedText: results.map((r) => r.correctedText).join('\n\n'),
    combinedIssues,
    issueTypeCounts,
    totalIssues: combinedIssues.length,
    isMarketingCopy: results.some((r) => r.isMarketingCopy),
    copySuggestions: results.find((r) => r.copySuggestions)?.copySuggestions || null,
  };
}
