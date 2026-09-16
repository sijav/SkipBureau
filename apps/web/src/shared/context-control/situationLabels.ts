import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'

/**
 * The name the Role row gives each situation a researched rule names (SB-286), keyed by the criterion's value, which the
 * API lists for a country. Interface text, as a fact's label is, and not content: a situation means the same in every
 * country that names it. situationLabels.test.ts fails for a situation the research names with no name here.
 */
export const SITUATION_LABELS: Record<string, MessageDescriptor> = {
  worker: msg`Worker`,
  // SB-212: the two company states name what the reader is DOING, and are deliberately exclusive.
  // "Company founder" read as "I own a company" to somebody who founded theirs years ago, and a
  // situation is matched with ===, so picking the wrong one of two overlapping names silently costs
  // a reader the duties scoped to the other.
  'company-founder': msg`I am starting a company`,
  'existing-company-owner': msg`I run an existing company`,
}
