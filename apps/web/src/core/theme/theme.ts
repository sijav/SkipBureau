import { createTheme, type Theme } from '@mui/material/styles'
import { dark, layout, light, radius, spacing, type } from './tokens'

export type Mode = 'light' | 'dark'
export type Direction = 'ltr' | 'rtl'

/**
 * What a caller may ASK for, which is a superset of what the theme is built
 * from. `system` is a deferral, not a palette: it is resolved to a `Mode`
 * before `appTheme` ever sees it.
 */
export type ModeChoice = Mode | 'system'

const face = (style: (typeof type)[keyof typeof type]) => ({
  fontFamily: style.family,
  fontSize: style.size,
  lineHeight: `${style.line}px`,
  fontWeight: style.weight,
  ...('uppercase' in style && style.uppercase ? { textTransform: 'uppercase' as const, letterSpacing: '0.06em' } : {}),
})

/**
 * The app theme, built from `tokens.ts`.
 *
 * Two things are deliberate here.
 *
 * The full token set hangs off `theme.tokens`, not just the handful MUI's
 * palette has slots for. MUI has no home for `warningBorder` or `accentText`,
 * and without somewhere to put them a component reaches for the hex instead,
 * which is the thing this task exists to prevent.
 *
 * Spacing is 8px so `sx={{ p: 2 }}` is 16, matching the `md` step. The 4px
 * half-step is `0.5`, and the design says it is for padding inside tags and
 * chips only, never for layout.
 */
export const appTheme = (mode: Mode, direction: Direction): Theme => {
  const tokens = mode === 'dark' ? dark : light

  return createTheme({
    direction,
    spacing: spacing.sm,
    shape: { borderRadius: radius.md },
    tokens,
    layout,
    palette: {
      mode,
      background: { default: tokens.background, paper: tokens.surface },
      text: { primary: tokens.textPrimary, secondary: tokens.textSecondary, disabled: tokens.textTertiary },
      divider: tokens.border,
      primary: {
        main: tokens.accent,
        light: tokens.accentSubtle,
        dark: tokens.accentPressed,
        contrastText: tokens.textOnAccent,
      },
      // `textOnWarning`, NOT `warningText`. The latter is for text on the SUBTLE
      // fill; on the amber itself it measures 2.82 in light and 1.19 in dark.
      warning: { main: tokens.warning, light: tokens.warningSubtle, dark: tokens.warningPressed, contrastText: tokens.textOnWarning },
      error: { main: tokens.danger, light: tokens.dangerSubtle, dark: tokens.dangerPressed, contrastText: tokens.textOnDanger },
      success: { main: tokens.success, contrastText: tokens.textOnAccent },
    },
    typography: {
      fontFamily: type.body.family,
      h1: face(type.display),
      h2: face(type.h1),
      h3: face(type.h2),
      h4: face(type.h3),
      body1: face(type.body),
      body2: face(type.bodySmall),
      subtitle1: face(type.bodyLarge),
      button: { ...face(type.label), textTransform: 'none' },
      caption: face(type.metadata),
      overline: face(type.labelSmall),
    },
    components: {
      // The design has no pill radius and says why. A button that rounds itself
      // would reintroduce it one component at a time.
      MuiButton: { styleOverrides: { root: { borderRadius: radius.sm } }, defaultProps: { disableElevation: true } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
    },
  })
}
