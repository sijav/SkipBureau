import { createTheme, type Theme } from '@mui/material/styles'

/**
 * A minimal theme so the scaffold renders. The real one, built from the tokens
 * in DESIGN.md, is SB-003: palette, typography, spacing, radii, and the dark
 * mode that has to be derived because the Figma file does not contain one.
 *
 * Nothing here should be treated as a design decision. It exists so `npm run
 * dev` shows a page and Storybook has a theme to mount stories in.
 */
export const appTheme = (mode: 'light' | 'dark', direction: 'ltr' | 'rtl'): Theme =>
  createTheme({
    direction,
    palette: { mode },
    shape: { borderRadius: 6 },
  })
