import { ThemeProvider } from '@mui/material/styles'
import { useEffect, useMemo, type ReactNode } from 'react'
import { appTheme, type Direction, type Mode } from './theme'

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

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
