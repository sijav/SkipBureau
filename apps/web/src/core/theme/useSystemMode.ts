import { useSyncExternalStore } from 'react'
import { onSystemModeChange, systemMode } from './systemMode'
import type { Mode } from './theme'

/**
 * Light where there is no window.
 *
 * `useSyncExternalStore` asks for this separately because the answer during
 * server rendering cannot come from a media query. When these pages are
 * prerendered for search engines there is no browser to ask, and the honest
 * answer is the mode the design was actually drawn in.
 */
const serverMode = (): Mode => 'light'

export const useSystemMode = (): Mode => useSyncExternalStore(onSystemModeChange, systemMode, serverMode)
