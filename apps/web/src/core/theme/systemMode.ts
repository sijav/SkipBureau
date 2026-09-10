import type { Mode } from './theme'

/**
 * The reader's operating system preference, as a store rather than as a hook.
 *
 * There is no React in here on purpose. A media query is an external source of
 * truth with a current value and a subscription, which is the exact shape
 * `useSyncExternalStore` expects to be handed, and keeping the two apart means
 * the browser half can be tested without rendering anything.
 *
 * `window.matchMedia` rather than a bare `matchMedia`, per the working
 * agreement: browser globals go through `window` so they stay mockable, and
 * the node test below relies on precisely that.
 */

const DARK = '(prefers-color-scheme: dark)'

export const systemMode = (): Mode => (window.matchMedia(DARK).matches ? 'dark' : 'light')

/**
 * Subscribe to changes, and return the unsubscribe.
 *
 * The list is captured once so that `removeEventListener` is called on the
 * same object that `addEventListener` was: `matchMedia` hands back a new
 * `MediaQueryList` each call, and removing a listener from a different one
 * silently does nothing, which would leak a listener per mount.
 */
export const onSystemModeChange = (listener: () => void): (() => void) => {
  const query = window.matchMedia(DARK)

  query.addEventListener('change', listener)

  return () => query.removeEventListener('change', listener)
}
