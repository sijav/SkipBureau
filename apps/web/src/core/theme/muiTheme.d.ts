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
