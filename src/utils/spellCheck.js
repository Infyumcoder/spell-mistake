import nspell from 'nspell';

let spellPromise = null;

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

function tokenize(text) {
  const tokens = [];
  const re = /[A-Za-z][A-Za-z'’-]*/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    tokens.push({ word: match[0], index: match.index });
  }
  return tokens;
}

function isCheckable(word) {
  if (word.length < 2) return false;
  if (/\d/.test(word)) return false;
  return true;
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// Returns valid words formed by inserting exactly one missing letter.
function getMissingLetterFixes(word, spell) {
  const lower = word.toLowerCase();
  const fixes = [];
  for (let i = 0; i <= lower.length; i++) {
    for (const ch of LETTERS) {
      const candidate = lower.slice(0, i) + ch + lower.slice(i);
      if (spell.correct(candidate) && !fixes.includes(candidate)) {
        fixes.push(candidate);
        if (fixes.length >= 5) return fixes;
      }
    }
  }
  return fixes;
}

export async function checkSpelling(text) {
  const spell = await getSpell();
  const tokens = tokenize(text || '');
  const issues = [];
  const seen = new Map();

  for (const { word, index } of tokens) {
    if (!isCheckable(word)) continue;
    const clean = word.replace(/^['’\-]+|['’\-]+$/g, '');
    if (!clean || !isCheckable(clean)) continue;

    const correct = spell.correct(clean) || spell.correct(clean.toLowerCase());
    if (correct) continue;

    // Only flag if exactly one letter insertion fixes it
    const fixes = getMissingLetterFixes(clean, spell);
    if (fixes.length === 0) continue;

    issues.push({ word: clean, index, suggestions: fixes });

    const key = clean.toLowerCase();
    if (seen.has(key)) {
      seen.get(key).count += 1;
    } else {
      seen.set(key, { word: clean, count: 1, suggestions: fixes });
    }
  }

  return {
    total: tokens.length,
    misspelledCount: issues.length,
    issues,
    uniqueIssues: Array.from(seen.values()).sort((a, b) => b.count - a.count),
  };
}

export function warmUp() {
  getSpell().catch(() => {});
}
