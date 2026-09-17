import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { Detail } from 'src/core/graphql'

/**
 * The question a rule card asks for each detail the API can ask a reader about (SB-315), kept beside the rows that
 * collect them so the two are edited together.
 *
 * Keyed by `Detail`, which is a union and not data, so a detail the API gains fails the build HERE until it has a
 * question, rather than in the guide screen that asks it. situationLabels.ts beside this one is the same shape keyed
 * by `string`, where only its test can catch an omission, because those keys are values the API sends.
 *
 * What this does NOT promise: that the context panel has a row able to collect each of these. Its rows are hand
 * written and derived from nothing, so a detail with no row, or a row with no detail, still passes quietly (SB-430).
 *
 * `msg` and not `t`, and the reason is not style: this is a module level constant, evaluated once at import, so `t`
 * here would fix the locale at whatever it was when the module loaded. The guide resolves it with `i18n._` where it
 * renders, which is what follows the language toolbar.
 */
export const DETAIL_PROMPTS: Readonly<Record<Detail, MessageDescriptor>> = {
  residenceRegion: msg`Where you live`,
  residenceStatus: msg`Your residence status`,
  nationality: msg`Your nationality`,
  // The panel's row is Role, so the question uses its word (SB-286).
  situation: msg`Your role`,
  workRegion: msg`Where you work`,
}
