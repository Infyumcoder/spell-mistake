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
  // Skip acronyms/initialisms (ROI, CRM, SMS, …) — not real typos.
  if (word === word.toUpperCase()) return false;
  return true;
}

// A "misspelled" word that's actually two real words stuck together
// (e.g. "Nowwe" from "Now" + "we", missing a space between them) is a
// spacing/extraction artifact, not a spelling mistake — don't flag it.
function isMissingSpace(word, spell) {
  const lower = word.toLowerCase();
  for (let i = 2; i <= lower.length - 2; i++) {
    const left = lower.slice(0, i);
    const right = lower.slice(i);
    if (spell.correct(left) && spell.correct(right)) return true;
  }
  return false;
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

    // Not a spelling mistake — just two real words with a missing space.
    if (isMissingSpace(clean, spell)) continue;

    // nspell's suggest() catches every kind of typo — missing, extra, wrong,
    // or transposed letters — not just single-letter insertions.
    const suggestions = spell.suggest(clean.toLowerCase()).slice(0, 5);

    issues.push({ word: clean, index, suggestions });

    const key = clean.toLowerCase();
    if (seen.has(key)) {
      seen.get(key).count += 1;
    } else {
      seen.set(key, { word: clean, count: 1, suggestions });
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
