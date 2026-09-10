/**
 * The design tokens, from `DESIGN.md`, which took them from Figma
 * `Xk7m6KtxdfGtZb6CO32K74` page `0:1`.
 *
 * This is the only file in the app allowed to contain a colour literal.
 * Components bind to a token name through the theme, never to a value, so that
 * changing a colour is one edit here and dark mode is not a retrofit.
 *
 * The names are the design's own, not invented: `accent`, `warning`, `danger`
 * carry meaning rather than hue. Amber means a date or a condition is at stake.
 * Red means the user is stopped, refused, or at risk.
 */

/** The raw palette, as the swatches name them. Semantic tokens point at these. */
export const primitives = {
  paper: { base: '#F8FAF8', white: '#FFFFFF', sunk: '#F1F5F2' },
  ink: { 900: '#1D2421', 600: '#5F6964', 400: '#828B86' },
  rule: { 300: '#DDE5E0', 500: '#C4CEC8' },
  mint: { 100: '#E3F5EE', 150: '#D3EEE4', 700: '#3EB489', 750: '#38A67F', 800: '#329C76', 900: '#277C5E', 950: '#1F6B50' },
  orange: { 100: '#FFF3DC', 300: '#F6D18B', 700: '#F2A93B', 800: '#DD9226', 900: '#C77B17', 950: '#96590B' },
  red: { 100: '#FDEAEA', 300: '#F3B8B8', 700: '#E05252', 800: '#C94343', 900: '#AE3636', 950: '#8E2A2A' },
} as const

/**
 * Light is the mode the design was drawn in. Every value here is transcribed,
 * not chosen.
 *
 * `textOnAccent` is near-black and the Figma swatch records that it was white:
 * white on mint does not reach 4.5:1, ink on it does. `accentText` is the
 * darker mint used for text and focus rings on light grounds, because `accent`
 * itself measures 2.47:1 against the page and misses the 3:1 that a non-text
 * indicator needs. Neither is a preference.
 */
export const light = {
  background: primitives.paper.base,
  surface: primitives.paper.white,
  surfaceSubtle: primitives.paper.sunk,

  textPrimary: primitives.ink[900],
  textSecondary: primitives.ink[600],
  textTertiary: primitives.ink[400],

  border: primitives.rule[300],
  borderStrong: primitives.rule[500],

  accent: primitives.mint[700],
  accentSubtle: primitives.mint[100],
  accentSubtleHover: primitives.mint[150],
  // Figma's own variables, restored in SB-035. They had been moved one step
  // down the ramp to rescue MUI's contained button, which hovered to
  // accentPressed with ink on it (3.11). Figma's Button never puts text on
  // accentPressed, it is only the press stroke, so the rescue lost its reason
  // the day the Button started following the design. DESIGN.md has the history.
  accentHover: primitives.mint[800],
  accentPressed: primitives.mint[900],
  accentText: primitives.mint[950],
  textOnAccent: primitives.ink[900],
  success: primitives.mint[700],

  warning: primitives.orange[700],
  warningSubtle: primitives.orange[100],
  warningHover: primitives.orange[800],
  warningPressed: primitives.orange[900],
  warningBorder: primitives.orange[300],
  warningText: primitives.orange[950],
  // Ink, not the deep orange. `warningText` is for text on the SUBTLE fill;
  // on the amber fill itself it measures 2.82, which is what the theme was
  // handing MUI as warning.contrastText.
  textOnWarning: primitives.ink[900],

  danger: primitives.red[800],
  dangerSubtle: primitives.red[100],
  // Restored to Figma's variables for the same reason. `danger` itself stays
  // one step down: it is MUI's error.main, which colours error TEXT on light
  // grounds, and the design's red/700 misses 4.5 there. Figma's Destructive
  // button rests on dangerHover, never on danger, which is why the two can now
  // share a value without the button losing a state.
  dangerHover: primitives.red[800],
  dangerPressed: primitives.red[900],
  dangerBorder: primitives.red[300],
  dangerText: primitives.red[900],
  dangerDeep: primitives.red[950],
  textOnDanger: primitives.paper.white,
} as const

export type ColourTokens = Record<keyof typeof light, string>

/**
 * **Dark is derived, not transcribed. There is no dark mode in the Figma file.**
 *
 * It has since been MEASURED. Every pair the product renders clears its target
 * in both modes, and `contrast.test.ts` fails on any that stops doing so. An
 * earlier version of this comment still told the reader that measuring was a
 * future task after the task had done it.
 *
 * So this is reasoning, and it is written down rather than buried:
 *
 * - The paper scale inverts into near-black greens that keep the warmth of the
 *   light ground rather than going flat grey. `surface` sits ABOVE `background`
 *   in lightness, the opposite of light mode, because a raised surface on a
 *   dark ground is lighter, not whiter.
 * - Ink inverts to off-white. Pure white on a dark ground reads as glare at
 *   body length, and this product is read at length.
 * - The accent, warning and danger hues do not change, because they carry
 *   meaning. They lighten, because the same mint that passes on paper does not
 *   pass on near-black.
 * - `textOnAccent` stays near-black. The accent stays light enough that ink on
 *   it is still the readable choice, which keeps a button identical in both
 *   modes and avoids a second rule nobody remembers.
 * - The subtle fills become dark tints of their hue rather than pale ones, or
 *   they glow.
 *
 * Measured, not just considered. `contrast.ts` declares every pair the product
 * renders and `contrast.test.ts` fails on any that misses, in both modes. Two
 * values here moved to make that true: `textOnDanger` is ink rather than white,
 * because dark LIGHTENS the semantic fills and white on a light red is the
 * wrong way round, and `dangerPressed` was lifted until ink cleared 4.5 on it.
 * Still derived rather than transcribed, which is a different claim and the one
 * DESIGN.md makes.
 */
export const dark = {
  background: '#121714',
  surface: '#1A211E',
  surfaceSubtle: '#222A26',

  textPrimary: '#E8EDEA',
  textSecondary: '#A9B3AE',
  textTertiary: '#7C8681',

  border: '#2E3833',
  borderStrong: '#414C46',

  accent: '#4CC79A',
  accentSubtle: '#163027',
  accentSubtleHover: '#1B3B2E',
  accentHover: '#63D3AA',
  accentPressed: '#3EB489',
  accentText: '#7FDCB8',
  textOnAccent: primitives.ink[900],
  success: '#4CC79A',

  warning: '#F5B857',
  warningSubtle: '#3A2C12',
  warningHover: '#F8C876',
  warningPressed: '#F2A93B',
  warningBorder: '#5C441A',
  warningText: '#F8CE86',
  textOnWarning: primitives.ink[900],

  danger: '#EC6B6B',
  dangerSubtle: '#3A1D1D',
  dangerHover: '#F08484',
  dangerPressed: '#E86262',
  dangerBorder: '#5C2A2A',
  dangerText: '#F09B9B',
  dangerDeep: '#F3B8B8',
  textOnDanger: primitives.ink[900],
} as const satisfies ColourTokens

/**
 * Three typefaces, three jobs, from the design:
 *
 * Archivo runs the interface. Source Serif carries anything read at length, so
 * a serif paragraph signals explanation rather than a control. IBM Plex Mono
 * marks anything that came from a record: dates, reference numbers, costs,
 * verification stamps.
 */
export const fonts = {
  ui: '"Archivo", system-ui, -apple-system, "Segoe UI", sans-serif',
  reading: '"Source Serif 4", Georgia, "Times New Roman", serif',
  data: '"IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace',
} as const

/** Size and line height in px, exactly as the design lists them. */
export const type = {
  display: { size: 44, line: 48, weight: 700, family: fonts.ui },
  h1: { size: 32, line: 38, weight: 700, family: fonts.ui },
  h2: { size: 24, line: 30, weight: 600, family: fonts.ui },
  h3: { size: 18, line: 24, weight: 600, family: fonts.ui },
  bodyLarge: { size: 18, line: 29, weight: 400, family: fonts.reading },
  body: { size: 16, line: 26, weight: 400, family: fonts.reading },
  bodySmall: { size: 14, line: 22, weight: 400, family: fonts.reading },
  uiText: { size: 14, line: 20, weight: 400, family: fonts.ui },
  // Figma's Label style tracks at 0.6 PERCENT, which get_design_context
  // reports as 0.084px at 14px. In em so it scales with the size.
  label: { size: 14, line: 20, weight: 600, family: fonts.ui, tracking: '0.006em' },
  labelSmall: { size: 12, line: 16, weight: 600, family: fonts.ui },
  metadata: { size: 11, line: 14, weight: 500, family: fonts.data, uppercase: true },
  monoData: { size: 13, line: 20, weight: 400, family: fonts.data },
} as const

/**
 * An 8px system. **4px is a half-step for tight padding inside tags and chips
 * only. It is never used for layout**, which is the design's own rule.
 */
export const spacing = { none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64, '4xl': 96 } as const

/**
 * **There is deliberately no full or pill radius.** The design says why: pill
 * tags are the strongest visual tell of generic SaaS, and this should read
 * closer to a well-set document than to a dashboard. Do not add one.
 */
export const radius = { none: 0, xs: 2, sm: 4, md: 6, lg: 8 } as const

/**
 * Widths are CAPS, not sizes. See DESIGN.md on what the design's numbers mean
 * below 1440. Heights are exact: 68 becomes 60 on scroll and neither may move.
 */
export const layout = {
  headerHeight: 68,
  headerHeightScrolled: 60,
  contentWidth: 1280,
  contentInset: 80,
  mainWidth: 1080,
  columnWidth: 860,
  readingWidth: 720,
  panelWidth: 640,
} as const
