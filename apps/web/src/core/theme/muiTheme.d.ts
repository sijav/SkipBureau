import type { ColourTokens, layout } from './tokens'

/**
 * The design has tokens MUI's palette has no slot for: `warningBorder`,
 * `accentText`, `surfaceSubtle` and the rest. Declaring them on the Theme means
 * a component can reach them from `sx` with the type checker's help, instead of
 * reaching for the hex.
 */
declare module '@mui/material/styles' {
  interface Theme {
    tokens: ColourTokens
    layout: typeof layout
  }
  interface ThemeOptions {
    tokens?: ColourTokens
    layout?: typeof layout
  }
}

/**
 * The design's four button styles, by meaning, and nothing else.
 *
 * `text`, `outlined` and `contained` are removed so a call site cannot reach a
 * look the design never drew. `color` and `size` are removed because they do
 * nothing to these variants: MUI's colour and size rules only match its own
 * variant names, so `color="error"` would compile and silently stay green. The
 * design also says one size only in v1.
 */
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    primary: true
    secondary: true
    ghost: true
    destructive: true
    text: false
    outlined: false
    contained: false
  }
  interface ButtonPropsColorOverrides {
    inherit: false
    primary: false
    secondary: false
    success: false
    error: false
    info: false
    warning: false
  }
  interface ButtonPropsSizeOverrides {
    small: false
    medium: false
    large: false
  }
}

/** Figma's UI Text and Mono Data styles, as Typography variants of their own. */
declare module '@mui/material/styles' {
  interface TypographyVariants {
    uiText: import('react').CSSProperties
    monoData: import('react').CSSProperties
  }
  interface TypographyVariantsOptions {
    uiText?: import('react').CSSProperties
    monoData?: import('react').CSSProperties
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    uiText: true
    monoData: true
  }
}
