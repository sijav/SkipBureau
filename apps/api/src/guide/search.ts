/**
 * How a question is matched against what SkipBureau wrote, SB-149.
 *
 * In memory, over one country's content, which is a few dozen guides: a
 * database index is not worth its weight until there are thousands. Both sides
 * are normalised the same way, so Persian typed with Arabic letters or without
 * its half-spaces still finds Persian written with them, and "companies"
 * finds "company".
 */

// Arabic letters a Persian keyboard or a pasted text often carries in place of
// the Persian ones.
const LETTERS: Readonly<Record<string, string>> = {
  ي: 'ی', // Arabic yeh, Persian yeh
  ى: 'ی', // alef maksura
  ك: 'ک', // Arabic kaf, Persian keheh
  ة: 'ه', // teh marbuta
  ۀ: 'ه', // heh with yeh above
  أ: 'ا', // alef with hamza above
  إ: 'ا', // alef with hamza below
  ٱ: 'ا', // alef wasla
  ؤ: 'و', // waw with hamza
}
const ARABIC_LETTERS = /[يىكةۀأإٱؤ]/g
// Persian and Arabic-Indic digits, read as the digits they are.
const DIGITS = /[\u06F0-\u06F9\u0660-\u0669]/g
const digitOf = (char: string): string => {
  const code = char.charCodeAt(0)
  return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660)
}
// Short vowels, the superscript alef and the kashida: marks a reader may or
// may not type, which change no word.
const MARKS = /[\u064B-\u065F\u0670\u0640]/g
// The zero-width non-joiner, the Persian half-space. Removed rather than made a
// space, so the word for SIM card finds itself typed whole, split or joined.
const HALF_SPACE = /\u200C/g

// Words that match nearly everything, and so tell nothing apart.
const STOP = new Set([
  ...[
    'the',
    'and',
    'for',
    'can',
    'how',
    'what',
    'who',
    'when',
    'where',
    'why',
    'with',
    'want',
    'need',
    'get',
    'have',
    'does',
    'from',
    'into',
  ],
  ...[
    'your',
    'you',
    'are',
    'was',
    'will',
    'this',
    'that',
    'there',
    'about',
    'which',
    'should',
    'would',
    'could',
    'do',
    'is',
    'in',
    'to',
    'of',
    'a',
    'an',
  ],
  ...['my', 'me', 'it', 'on', 'or', 'if', 'as', 'at', 'be', 'by', 'we', 'our', 'am', 'i'],
  // Persian: from, to, with, in, that, the object marker, this, that, for, what,
  // how (twice), where, when, I, we, you, one, and, or, also, until, if, is (twice),
  // must, the verb prefix, I want, what is, I do, did, becomes, I have.
  ...['از', 'به', 'با', 'در', 'که', 'را', 'این', 'آن'],
  ...['برای', 'چه', 'چطور', 'چگونه', 'کجا', 'کی'],
  ...['من', 'ما', 'شما', 'یک', 'و', 'یا', 'هم', 'تا', 'اگر'],
  ...['است', 'هست', 'باید', 'می', 'میخواهم', 'چیست'],
  ...['کنم', 'کرد', 'شود', 'دارم'],
])

/** Case, compatibility forms, marks, half-spaces, Arabic letters and digits folded away. */
export const fold = (text: string): string =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(HALF_SPACE, '')
    .replace(MARKS, '')
    .replace(DIGITS, digitOf)
    .replace(ARABIC_LETTERS, (letter) => LETTERS[letter] ?? letter)

// English only, and only the endings that change nothing a reader would search
// by: companies, registering, registered, permits.
const stem = (word: string): string => {
  if (!/^[a-z]+$/.test(word) || word.length < 5) return word
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.endsWith('ing') && word.length > 6) return word.slice(0, -3)
  if (word.endsWith('ed') && word.length > 5) return word.slice(0, -2)
  if (word.endsWith('es') && /(ss|sh|ch|x)es$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

const tokens = (text: string): string[] =>
  fold(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

/** The words of a question worth matching, folded and stemmed. Latin words shorter than three letters tell nothing apart. */
export const wordsOf = (question: string): string[] => [
  ...new Set(
    tokens(question)
      .filter((word) => !STOP.has(word) && (word.length >= 3 || /[^\p{Script=Latin}\p{N}]/u.test(word)))
      .map(stem),
  ),
]

/** Text folded and stemmed the same way, to look words up in. */
const haystackOf = (text: string): string => ` ${tokens(text).map(stem).join(' ')} `

// A Latin word matches from the start of a word, so bank finds banking and
// port does not find passport. Persian compounds are written joined as often
// as apart, so a Persian word matches anywhere in one.
const LATIN = /^[\p{Script=Latin}\p{N}]+$/u
const holds = (hay: string, word: string): boolean => hay.includes(LATIN.test(word) ? ` ${word}` : word)

/** One thing a search can find: its fields, heaviest first, and what to show if it wins. */
export type Field = { text: string | null | undefined; weight: number; snippet?: boolean }

export type Match = { score: number; matched: number; snippet: string | null }

// A title outweighs a description, which outweighs the body of a guide.
export const WEIGHT = { title: 6, summary: 3, body: 1 } as const

const SNIPPET = 180

const sentencesOf = (text: string): string[] => text.split(/(?<=[.!?؟])\s+/u).filter(Boolean)

/**
 * How well the words match: each word counts once, by the heaviest field it is
 * in, so a guide that names the thing in its title beats one that mentions it
 * in passing. The snippet is the sentence that holds the most of the words.
 */
export const match = (words: readonly string[], fields: readonly Field[]): Match => {
  const folded = fields.flatMap((field) => (field.text ? [{ ...field, text: field.text, hay: haystackOf(field.text) }] : []))
  let score = 0
  let matched = 0
  for (const word of words) {
    const heaviest = folded.reduce((best, field) => (holds(field.hay, word) ? Math.max(best, field.weight) : best), 0)
    if (heaviest > 0) {
      score += heaviest
      matched += 1
    }
  }
  if (matched === 0) return { score: 0, matched: 0, snippet: null }

  let snippet: string | null = null
  let most = 0
  for (const field of folded) {
    if (!field.snippet) continue
    for (const sentence of sentencesOf(field.text)) {
      const hay = haystackOf(sentence)
      const count = words.filter((word) => holds(hay, word)).length
      if (count > most) {
        most = count
        snippet = sentence
      }
    }
  }
  if (snippet && snippet.length > SNIPPET) snippet = `${snippet.slice(0, SNIPPET - 1).trimEnd()}…`
  // Most of the words first, then the heaviest places, so three words in a
  // paragraph beat one word in a title.
  return { score: matched * 100 + score, matched, snippet }
}

/** The best few of anything, by match, ties kept in their own order. */
export const best = <T>(items: readonly T[], matchOf: (item: T) => Match, limit: number): { item: T; match: Match }[] =>
  items
    .map((item, index) => ({ item, index, match: matchOf(item) }))
    .filter((entry) => entry.match.matched > 0)
    .sort((a, b) => b.match.score - a.match.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item, match: found }) => ({ item, match: found }))
