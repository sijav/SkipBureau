import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import rtlPlugin from '@mui/stylis-plugin-rtl'
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { prefixer } from 'stylis'
import './fonts'
import { appTheme, type Direction, type ModeChoice } from './theme'

const makeCaches = () => ({
  ltr: createCache({ key: 'sb', stylisPlugins: [prefixer] }),
  rtl: createCache({ key: 'sb-rtl', stylisPlugins: [prefixer, rtlPlugin] }),
})

// In the browser, one cache per direction, made once. Emotion keys its
// generated class names by cache, so building a new one on every render would
// leak stylesheets and lose the ordering that decides which rule wins. At
// build time (SB-155) every page renders in one process, and a shared cache
// writes a style only into the first page that uses it, so there each render
// makes its own.
const browserCaches = typeof window === 'undefined' ? null : makeCaches()

export type AppThemeProps = {
  children: ReactNode
  /**
   * `system` follows the reader's operating system and is the default, so a
   * caller that says nothing gets the mode the reader asked their machine for,
   * from CSS alone. A named mode overrides it, which is what Storybook's
   * toolbar does, through an attribute on `<html>`.
   */
  mode?: ModeChoice
  direction?: Direction
}

// Where a forced mode is written, and the selector that makes it count.
const FORCED = 'mode'
const FORCED_SELECTOR = `[data-${FORCED}="%s"]` as const

/**
 * Puts the theme in place and keeps the document's `dir` in step with it.
 *
 * The document attribute matters: MUI reads `direction` for its own components,
 * but anything using plain CSS logical properties follows the DOM, and the two
 * disagreeing is how a right-to-left layout ends up half mirrored.
 *
 * `CssBaseline` lives here rather than in each caller. It was rendered twice,
 * by the router shell and by the Storybook preview, and it takes
 * `enableColorScheme`, which is what writes `color-scheme` onto `<html>` and so
 * decides whether the browser paints its own scrollbars and form controls to
 * match. Two call sites meant one of them could be left painting a white
 * scrollbar down a dark page. Applying the baseline is the job of whatever owns
 * the theme.
 */
export const AppTheme = ({ children, mode = 'system', direction = 'ltr' }: AppThemeProps) => {
  const [caches] = useState(() => browserCaches ?? makeCaches())
  const forced = mode !== 'system'
  // Both schemes are in the theme (SB-108); what differs is only who decides
  // which applies, the reader's system or the attribute below.
  const theme = useMemo(() => appTheme(direction, forced ? FORCED_SELECTOR : 'media'), [direction, forced])

  useEffect(() => {
    window.document.documentElement.dir = direction
  }, [direction])

  // Before the frame is painted, so a forced story never shows the other scheme first.
  useLayoutEffect(() => {
    if (mode === 'system') return
    const root = window.document.documentElement
    root.dataset[FORCED] = mode
    return () => {
      delete root.dataset[FORCED]
    }
  }, [mode])

  return (
    <CacheProvider value={caches[direction]}>
      {/* noSsr: MUI's provider otherwise renders again after hydration, to
          learn the scheme, and that update lands while the routes are still
          hydrating, which makes React finish them in one half-second task on
          a phone (SB-108). Nothing it renders differs by scheme, CSS does. */}
      <ThemeProvider theme={theme} noSsr>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}
