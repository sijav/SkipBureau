import { createTheme, type Theme } from '@mui/material'
import { buttonRoot, buttonVariants } from './button'
import { ChevronDown } from './ChevronDown'
import { formHelperTextOverrides, formLabelOverrides, outlinedInputOverrides, selectOverrides } from './input'
import { dark, fonts, layout, light, radius, spacing, type } from './tokens'

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
  // Explicit either way. createTheme MERGES these into MUI's defaults, and
  // MUI's overline is uppercase, so Label Small rendered in capitals while the
  // design's tags are sentence case.
  textTransform: 'uppercase' in style && style.uppercase ? ('uppercase' as const) : ('none' as const),
  ...('uppercase' in style && style.uppercase ? { letterSpacing: '0.06em' } : {}),
  ...('tracking' in style ? { letterSpacing: style.tracking } : {}),
  // Persian is a cursive script with no monospaced tradition. IBM Plex Mono
  // has no Persian letters, so the browser fell through to a monospaced Arabic
  // face with each letter in its own cell, and tracking pulls the joins apart.
  // Seen in the information panel's eyebrow and source line in fa-IR. So in
  // Persian the mono styles set in the UI stack, where the owner's choice of
  // Persian face goes (SB-143), and nothing is tracked.
  ...(style.family === fonts.data
    ? { '&:lang(fa)': { fontFamily: fonts.ui, letterSpacing: 0 } }
    : 'tracking' in style
      ? { '&:lang(fa)': { letterSpacing: 0 } }
      : {}),
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
      // MUI paints a filled control's HOVER from `dark`, so `dark` is the
      // design's hover step, accentHover, not accentPressed: the design only
      // ever uses accentPressed as a stroke.
      primary: {
        main: tokens.accent,
        light: tokens.accentSubtle,
        dark: tokens.accentHover,
        contrastText: tokens.textOnAccent,
      },
      // `textOnWarning`, NOT `warningText`. The latter is for text on the SUBTLE
      // fill; on the amber itself it measures 2.82 in light and 1.19 in dark.
      warning: { main: tokens.warning, light: tokens.warningSubtle, dark: tokens.warningPressed, contrastText: tokens.textOnWarning },
      error: { main: tokens.danger, light: tokens.dangerSubtle, dark: tokens.dangerPressed, contrastText: tokens.textOnDanger },
      // All four slots, deliberately. MUI's augmentColor derives whichever of
      // main, light, dark and contrastText it is not given, so an entry with
      // only two of them gets a hover fill this repository never chose and the
      // contrast inventory never measured.
      success: {
        main: tokens.success,
        light: tokens.accentSubtle,
        dark: tokens.accentHover,
        contrastText: tokens.textOnAccent,
      },
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
      // Figma's Mono Data, which MUI has no variant for: sources, dates and
      // references set in IBM Plex Mono. Typed in muiTheme.d.ts.
      monoData: face(type.monoData),
    },
    components: {
      // The four styles of Figma 11:44, from button.ts. Secondary is the default
      // because it is the one that claims nothing: Primary is "the one action
      // this screen exists for", so it should always be asked for by name. No
      // ripple, because the design marks a press with a fill, not a splash.
      MuiButton: {
        defaultProps: { variant: 'secondary', disableRipple: true },
        styleOverrides: { root: { ...buttonRoot(tokens), variants: buttonVariants(tokens) } },
      },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
      // A custom variant has no element of its own; a source line is a paragraph.
      MuiTypography: { defaultProps: { variantMapping: { monoData: 'p' } } },
      // The text input of Figma 16:32, composed from these three because the
      // design's label sits above the field, not in MUI's notch. input.ts.
      MuiOutlinedInput: { styleOverrides: outlinedInputOverrides(tokens, face(type.uiText)) },
      MuiFormLabel: { styleOverrides: formLabelOverrides(tokens, face(type.label)) },
      MuiFormHelperText: { styleOverrides: formHelperTextOverrides(tokens, face(type.bodySmall)) },
      // Figma 16:53. The field is MuiOutlinedInput's, above; this is the chevron.
      MuiSelect: { defaultProps: { IconComponent: ChevronDown }, styleOverrides: selectOverrides(tokens) },
    },
  })
}
