import nspell from 'nspell';

let spellPromise = null;

// Load the English Hunspell dictionary once and build a spell checker.
// The .aff/.dic files live in /public/dict and are fetched at runtime so the
// checker works entirely in the browser. To support another language, drop a
// matching pair of Hunspell files in public/dict and update the paths below.
async function getSpell() {
  if (!spellPromise) {
    spellPromise = (async () => {
      const base = import.meta.env.BASE_URL || '/';
      const [aff, dic] = await Promise.all([
        fetch(`${base}dict/en.aff`).then((r) => r.text()),
        fetch(`${base}dict/en.dic`).then((r) => r.text()),
      ]);
      return nspell(aff, dic);
    })();
  }
  return spellPromise;
}

// Split text into word tokens while remembering where each one starts,
// so the UI can highlight the exact word in the original text.
function tokenize(text) {
  const tokens = [];
  const re = /[A-Za-z][A-Za-z'\u2019-]*/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    tokens.push({ word: match[0], index: match.index });
  }
  return tokens;
}

// Skip tokens we shouldn't flag: too short, or containing digits.
function isCheckable(word) {
  if (word.length < 2) return false;
  if (/\d/.test(word)) return false;
  return true;
}

/**
 * Check a block of text and return a report.
 * @param {string} text
 */
export async function checkSpelling(text) {
  const spell = await getSpell();
  const tokens = tokenize(text || '');
  const issues = [];
  const seen = new Map();

  for (const { word, index } of tokens) {
    if (!isCheckable(word)) continue;
    const clean = word.replace(/^['\u2019-]+|['\u2019-]+$/g, '');
    if (!clean) continue;

    const correct = spell.correct(clean) || spell.correct(clean.toLowerCase());
    if (!correct) {
      const suggestions = spell.suggest(clean).slice(0, 5);
      issues.push({ word: clean, index, suggestions });

      const key = clean.toLowerCase();
      if (seen.has(key)) {
        seen.get(key).count += 1;
      } else {
        seen.set(key, { word: clean, count: 1, suggestions });
      }
    }
  }

  return {
    total: tokens.length,
    misspelledCount: issues.length,
    issues,
    uniqueIssues: Array.from(seen.values()).sort((a, b) => b.count - a.count),
  };
}

// Warm up the dictionary in the background so the first check feels instant.
export function warmUp() {
  getSpell().catch(() => {});
}
