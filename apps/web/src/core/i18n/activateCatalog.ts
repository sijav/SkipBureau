import type { Messages } from '@lingui/core'
import type { Locale } from './locales'

/**
 * Lingui's own compiled-catalog type, re-exported rather than redefined.
 *
 * The first version declared `Record<string, unknown>` here, which typechecked
 * on its own and then would not pass to `i18n.loadAndActivate`. A parallel
 * definition of someone else's type is a bug with a delay on it.
 */
export type { Messages }

export type Activation = 'activated' | 'stale' | 'failed'

export type ActivateArgs = {
  locale: Locale
  /** Fetches the compiled catalog. Rejects if it is missing or unparseable. */
  load: (locale: Locale) => Promise<Messages>
  /** Whether this request is still the one the user is waiting for. */
  isCurrent: () => boolean
  /** Makes the catalog live. Only called for a request that is still current. */
  activate: (locale: Locale, messages: Messages) => void
}

/**
 * Loads a catalog and activates it, but only if it is still wanted.
 *
 * The ordering is the whole point, and it is why this is a function rather than
 * three lines inside an effect. `activate` mutates global lingui state, so the
 * check has to sit **between the await and the activation**. Guarding only what
 * happens after activation is what the first version did, and it meant a fast
 * en to fa to en could leave Persian rendering while the control said English.
 *
 * Nothing here touches React, so the out-of-order case is testable directly
 * instead of through a browser.
 */
export const activateCatalog = async ({ locale, load, isCurrent, activate }: ActivateArgs): Promise<Activation> => {
  let messages: Messages

  try {
    messages = await load(locale)
  } catch {
    return 'failed'
  }

  // Between the await and the activation. A request that lost the race loads
  // its messages and then does nothing with them.
  if (!isCurrent()) return 'stale'

  activate(locale, messages)
  return 'activated'
}
