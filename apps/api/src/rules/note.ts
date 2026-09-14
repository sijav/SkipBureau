import { pick } from '../locale.js'
import type { Note } from './diff.js'

/**
 * A rule version's note in the language asked for, or else the one it has,
 * saying so, and none where it has no note in any language (SB-209).
 */
export const notesOf = (ruleVersionId: string, texts: readonly { locale: string; notes: string }[], locale: string): Note[] => {
  const { text, missing } = pick(texts, locale)
  return text ? [{ ruleVersionId, text: text.notes, locale: text.locale, translationMissing: missing }] : []
}
