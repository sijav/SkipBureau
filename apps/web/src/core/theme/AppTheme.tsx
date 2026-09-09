import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import rtlPlugin from '@mui/stylis-plugin-rtl'
import { ThemeProvider } from '@mui/material/styles'
import { useEffect, useMemo, type ReactNode } from 'react'
import { prefixer } from 'stylis'
import { appTheme, type Direction, type Mode } from './theme'

// One cache per direction, made once. Emotion keys its generated class names by
// cache, so building a new one on every render would leak stylesheets and lose
// the ordering that decides which rule wins.
const caches = {
  ltr: createCache({ key: 'sb', stylisPlugins: [prefixer] }),
  rtl: createCache({ key: 'sb-rtl', stylisPlugins: [prefixer, rtlPlugin] }),
}

export type AppThemeProps = {
  children: ReactNode
  mode?: Mode
  direction?: Direction
}

/**
 * Puts the theme in place and keeps the document's `dir` in step with it.
 *
 * The document attribute matters: MUI reads `direction` for its own components,
 * but anything using plain CSS logical properties follows the DOM, and the two
 * disagreeing is how a right-to-left layout ends up half mirrored.
 */
export const AppTheme = ({ children, mode = 'light', direction = 'ltr' }: AppThemeProps) => {
  const theme = useMemo(() => appTheme(mode, direction), [mode, direction])

  useEffect(() => {
    document.documentElement.dir = direction
  }, [direction])

  return (
    <CacheProvider value={caches[direction]}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  )
}
