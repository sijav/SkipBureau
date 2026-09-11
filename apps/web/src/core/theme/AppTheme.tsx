import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import rtlPlugin from '@mui/stylis-plugin-rtl'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { prefixer } from 'stylis'
import './fonts'
import { appTheme, type Direction, type Mode, type ModeChoice } from './theme'
import { useSystemMode } from './useSystemMode'

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
   * caller that says nothing gets the mode the reader asked their machine for.
   * A named mode overrides it, which is what Storybook's toolbar does.
   */
  mode?: ModeChoice
  direction?: Direction
}

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
  const system = useSystemMode()
  const resolved: Mode = mode === 'system' ? system : mode
  const theme = useMemo(() => appTheme(resolved, direction), [resolved, direction])

  useEffect(() => {
    window.document.documentElement.dir = direction
  }, [direction])

  return (
    <CacheProvider value={caches[direction]}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}
