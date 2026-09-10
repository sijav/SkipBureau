import type { ButtonVariant } from './button'
import type { PanelKind } from './panel'
import type { TagStatus } from './tag'
import type { ColourTokens } from './tokens'

/**
 * Contrast, measured rather than judged.
 *
 * The inventory below is the point of this file, not the arithmetic. It names
 * the pairs the application actually puts on screen, so a green test means
 * "nothing a reader sees misses its target" rather than "some token
 * combinations happen to pass".
 *
 * Three rules, each learned by getting it wrong:
 *
 * A pair is a ROLE, not two token names, and it says WHERE MUI paints it. An
 * earlier version declared a hovered primary button measuring `accentHover`, a
 * token nothing is mapped to, while the fill a cursor actually produces is
 * `accentPressed`.
 *
 * The binding is REQUIRED. It was optional once, and the test filtered to the
 * pairs that had one, so a pair added without a binding was contrast tested,
 * never bound, and green. Absence must not mean unchecked.
 *
 * An exemption is a RECORDED DECISION. `accent` against the page measures 2.47
 * and that is correct, because it is a fill that carries text and never a
 * standalone indicator. Without writing that down, someone measures it again in
 * six months and "fixes" it.
 */

const channel = (value: number): number => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)

/** WCAG 2.1 relative luminance. Six digit hex only, which tokens.ts enforces. */
export const luminance = (hex: string): number => {
  const packed = Number.parseInt(hex.slice(1), 16)
  const red = channel(((packed >> 16) & 255) / 255)
  const green = channel(((packed >> 8) & 255) / 255)
  const blue = channel((packed & 255) / 255)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export const contrastRatio = (one: string, other: string): number => {
  const [lighter, darker] = [luminance(one), luminance(other)].sort((a, b) => b - a)

  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

export type Token = keyof ColourTokens

/**
 * Where MUI paints a pair. Required, and a union, so a declaration cannot
 * decline to say.
 *
 * `palette` is MUI's filled control family, read out of `@mui/material` 9.4's
 * `Button.js`: a contained control takes its background from
 * `palette[color].main`, and from `palette[color].dark` inside a
 * `@media (hover: hover)` block. OUR Button no longer uses it: since SB-035 it
 * has its own four variants, and `contained` is removed from its type. Its ACTIVE state changes the shadow, not the
 * fill, so there is no third background. Coloured `Fab` follows the same
 * contract. Filled `Chip` does NOT, it composites its hover. Filled `Alert`
 * does not either: it paints `dark` in dark mode and takes its text from
 * `getContrastText(main)` rather than `contrastText`. Each of those needs its
 * own variant on the day it is used.
 *
 * `text` is MUI's own text-on-background slots. `CssBaseline` paints `body` as
 * `palette.text.primary` on `palette.background.default`, and `Paper` paints
 * `palette.text.primary` on `palette.background.paper`. `Typography` with no
 * `color` sets nothing and inherits. Binding these checks `theme.ts`'s mapping,
 * which is a real claim, rather than restating `tokens.ts`.
 *
 * There was briefly a third variant for pairs reached through `theme.tokens`.
 * It was a fig leaf: both sides come from `tokens.ts` and `theme.tokens` is
 * already asserted to mirror it, so resolving one proved a token equals itself.
 * No ordinary component consumes `theme.tokens`. Those pairs are in `EXEMPT`
 * until something paints them.
 *
 * A `@mui/material` upgrade invalidates all of it, because it is read out of
 * component source and the lockfile is what pins that source.
 */
export type Painted =
  | { by: 'palette'; entry: 'primary' | 'error' | 'warning' | 'success'; fill: 'main' | 'dark' }
  | { by: 'text'; fore: 'primary' | 'secondary'; back: 'default' | 'paper' }
  // `button` is the style button.ts emits for one variant in one state. A
  // variant with no fill of its own, Ghost at rest, is declared on a GROUND,
  // because the ground is what its label sits on.
  | { by: 'button'; variant: ButtonVariant; state: 'rest' | 'hover' | 'pressed' }
  // `focus` is the keyboard focus outline every button carries, against a ground.
  | { by: 'focus' }
  // `tag` is the fill and label tag.ts emits for one status.
  | { by: 'tag'; status: TagStatus }
  // `panel` is one text part of one information panel, on that panel's fill.
  | { by: 'panel'; kind: PanelKind; part: 'eyebrow' | 'body' | 'meta' }

export type Declared = {
  /** What a reader is actually looking at. Reads as a sentence in a failure. */
  role: string
  fore: Token
  back: Token
  /** 4.5 for text, 3 for a non-text thing that has to be seen on its own. */
  target: 4.5 | 3
  painted: Painted
}

/**
 * Every pair the app renders, with the role and the slot that render it.
 *
 * The filled states come in PAIRS, not threes: MUI paints a contained fill from
 * `main` and its hover from `dark`, and its active state changes the shadow
 * rather than the background.
 */
export const DECLARED: readonly Declared[] = [
  { role: 'body text on the page', fore: 'textPrimary', back: 'background', target: 4.5, painted: { by: 'text', fore: 'primary', back: 'default' } },
  { role: 'body text on a card', fore: 'textPrimary', back: 'surface', target: 4.5, painted: { by: 'text', fore: 'primary', back: 'paper' } },
  { role: 'secondary text on the page', fore: 'textSecondary', back: 'background', target: 4.5, painted: { by: 'text', fore: 'secondary', back: 'default' } },
  { role: 'secondary text on a card', fore: 'textSecondary', back: 'surface', target: 4.5, painted: { by: 'text', fore: 'secondary', back: 'paper' } },

  { role: 'a label on a primary fill', fore: 'textOnAccent', back: 'accent', target: 4.5, painted: { by: 'palette', entry: 'primary', fill: 'main' } },
  { role: 'a label on a primary fill, hovered', fore: 'textOnAccent', back: 'accentHover', target: 4.5, painted: { by: 'palette', entry: 'primary', fill: 'dark' } },

  { role: 'a label on a success fill', fore: 'textOnAccent', back: 'success', target: 4.5, painted: { by: 'palette', entry: 'success', fill: 'main' } },
  { role: 'a label on a success fill, hovered', fore: 'textOnAccent', back: 'accentHover', target: 4.5, painted: { by: 'palette', entry: 'success', fill: 'dark' } },


  { role: 'a label on a warning fill', fore: 'textOnWarning', back: 'warning', target: 4.5, painted: { by: 'palette', entry: 'warning', fill: 'main' } },
  { role: 'a label on a warning fill, hovered', fore: 'textOnWarning', back: 'warningPressed', target: 4.5, painted: { by: 'palette', entry: 'warning', fill: 'dark' } },

  // Figma 11:44, every style in every state a pointer can put it in.
  { role: 'a primary button label', fore: 'textOnAccent', back: 'accent', target: 4.5, painted: { by: 'button', variant: 'primary', state: 'rest' } },
  { role: 'a primary button label, hovered', fore: 'textOnAccent', back: 'accentHover', target: 4.5, painted: { by: 'button', variant: 'primary', state: 'hover' } },
  { role: 'a primary button label, pressed', fore: 'textOnAccent', back: 'accentHover', target: 4.5, painted: { by: 'button', variant: 'primary', state: 'pressed' } },

  { role: 'a secondary button label', fore: 'textPrimary', back: 'surface', target: 4.5, painted: { by: 'button', variant: 'secondary', state: 'rest' } },
  { role: 'a secondary button label, hovered', fore: 'textPrimary', back: 'surfaceSubtle', target: 4.5, painted: { by: 'button', variant: 'secondary', state: 'hover' } },
  { role: 'a secondary button label, pressed', fore: 'textPrimary', back: 'surfaceSubtle', target: 4.5, painted: { by: 'button', variant: 'secondary', state: 'pressed' } },

  { role: 'a ghost button label on the page', fore: 'accentText', back: 'background', target: 4.5, painted: { by: 'button', variant: 'ghost', state: 'rest' } },
  { role: 'a ghost button label on a card', fore: 'accentText', back: 'surface', target: 4.5, painted: { by: 'button', variant: 'ghost', state: 'rest' } },
  { role: 'a ghost button label, hovered', fore: 'accentText', back: 'accentSubtle', target: 4.5, painted: { by: 'button', variant: 'ghost', state: 'hover' } },
  { role: 'a ghost button label, pressed', fore: 'accentText', back: 'accentSubtleHover', target: 4.5, painted: { by: 'button', variant: 'ghost', state: 'pressed' } },

  { role: 'a destructive button label', fore: 'textOnDanger', back: 'dangerHover', target: 4.5, painted: { by: 'button', variant: 'destructive', state: 'rest' } },
  { role: 'a destructive button label, hovered', fore: 'textOnDanger', back: 'dangerPressed', target: 4.5, painted: { by: 'button', variant: 'destructive', state: 'hover' } },
  { role: 'a destructive button label, pressed', fore: 'textOnDanger', back: 'dangerDeep', target: 4.5, painted: { by: 'button', variant: 'destructive', state: 'pressed' } },

  // Non-text, so 3:1, against the ground it meets at its outer edge.
  { role: 'a focused button outline on the page', fore: 'accentText', back: 'background', target: 3, painted: { by: 'focus' } },
  { role: 'a focused button outline on a card', fore: 'accentText', back: 'surface', target: 3, painted: { by: 'focus' } },

  // Figma 13:26. Every status, including the three that share amber, so each
  // one is bound to what tag.ts actually paints for it.
  { role: 'an official tag label', fore: 'accentText', back: 'accentSubtle', target: 4.5, painted: { by: 'tag', status: 'official' } },
  { role: 'a verified tag label', fore: 'accentText', back: 'surface', target: 4.5, painted: { by: 'tag', status: 'verified' } },
  { role: 'a needs-context tag label', fore: 'warningText', back: 'warningSubtle', target: 4.5, painted: { by: 'tag', status: 'needsContext' } },
  { role: 'a deadline tag label', fore: 'warningText', back: 'warningSubtle', target: 4.5, painted: { by: 'tag', status: 'deadline' } },
  { role: 'a warning tag label', fore: 'warningText', back: 'warningSubtle', target: 4.5, painted: { by: 'tag', status: 'warning' } },
  { role: 'a blocked tag label', fore: 'dangerText', back: 'dangerSubtle', target: 4.5, painted: { by: 'tag', status: 'blocked' } },
  { role: 'a waiting tag label', fore: 'textSecondary', back: 'surfaceSubtle', target: 4.5, painted: { by: 'tag', status: 'waiting' } },
  { role: 'a completed tag label', fore: 'textSecondary', back: 'surface', target: 4.5, painted: { by: 'tag', status: 'completed' } },

  // Figma 14:26: the eyebrow, the body and the source line of every kind.
  { role: 'an official information panel, its eyebrow', fore: 'accentText', back: 'accentSubtle', target: 4.5, painted: { by: 'panel', kind: 'officialInformation', part: 'eyebrow' } },
  { role: 'an official information panel, its body', fore: 'textPrimary', back: 'accentSubtle', target: 4.5, painted: { by: 'panel', kind: 'officialInformation', part: 'body' } },
  { role: 'an official information panel, its source line', fore: 'textSecondary', back: 'accentSubtle', target: 4.5, painted: { by: 'panel', kind: 'officialInformation', part: 'meta' } },
  { role: 'a practical advice panel, its eyebrow', fore: 'textSecondary', back: 'surface', target: 4.5, painted: { by: 'panel', kind: 'practicalAdvice', part: 'eyebrow' } },
  { role: 'a practical advice panel, its body', fore: 'textPrimary', back: 'surface', target: 4.5, painted: { by: 'panel', kind: 'practicalAdvice', part: 'body' } },
  { role: 'a practical advice panel, its source line', fore: 'textSecondary', back: 'surface', target: 4.5, painted: { by: 'panel', kind: 'practicalAdvice', part: 'meta' } },
  { role: 'a warning panel, its eyebrow', fore: 'warningText', back: 'warningSubtle', target: 4.5, painted: { by: 'panel', kind: 'warning', part: 'eyebrow' } },
  { role: 'a warning panel, its body', fore: 'textPrimary', back: 'warningSubtle', target: 4.5, painted: { by: 'panel', kind: 'warning', part: 'body' } },
  { role: 'a warning panel, its source line', fore: 'textSecondary', back: 'warningSubtle', target: 4.5, painted: { by: 'panel', kind: 'warning', part: 'meta' } },
  { role: 'a scam warning panel, its eyebrow', fore: 'dangerText', back: 'dangerSubtle', target: 4.5, painted: { by: 'panel', kind: 'scamWarning', part: 'eyebrow' } },
  { role: 'a scam warning panel, its body', fore: 'textPrimary', back: 'dangerSubtle', target: 4.5, painted: { by: 'panel', kind: 'scamWarning', part: 'body' } },
  { role: 'a scam warning panel, its source line', fore: 'textSecondary', back: 'dangerSubtle', target: 4.5, painted: { by: 'panel', kind: 'scamWarning', part: 'meta' } },
  { role: 'a legal uncertainty panel, its eyebrow', fore: 'warningText', back: 'surface', target: 4.5, painted: { by: 'panel', kind: 'legalUncertainty', part: 'eyebrow' } },
  { role: 'a legal uncertainty panel, its body', fore: 'textPrimary', back: 'surface', target: 4.5, painted: { by: 'panel', kind: 'legalUncertainty', part: 'body' } },
  { role: 'a legal uncertainty panel, its source line', fore: 'textSecondary', back: 'surface', target: 4.5, painted: { by: 'panel', kind: 'legalUncertainty', part: 'meta' } },
  { role: 'a coverage gap panel, its eyebrow', fore: 'textSecondary', back: 'surfaceSubtle', target: 4.5, painted: { by: 'panel', kind: 'coverageGap', part: 'eyebrow' } },
  { role: 'a coverage gap panel, its body', fore: 'textPrimary', back: 'surfaceSubtle', target: 4.5, painted: { by: 'panel', kind: 'coverageGap', part: 'body' } },
  { role: 'a coverage gap panel, its source line', fore: 'textSecondary', back: 'surfaceSubtle', target: 4.5, painted: { by: 'panel', kind: 'coverageGap', part: 'meta' } },
]

/**
 * Pairs someone will reach for, and why each is not required.
 *
 * These are answers, not omissions. Anything moved out of here into `DECLARED`
 * needs the reason below to have stopped being true, and needs a binding,
 * because `DECLARED` will not accept it without one.
 */
export const EXEMPT: readonly { pair: string; because: string }[] = [
  {
    pair: 'textTertiary on any ground',
    because:
      "It is the theme's text.disabled and nothing else. WCAG 1.4.3 exempts inactive controls. The moment it is used for ordinary small text it has to reach 4.5, and it currently measures 3.34 on the light page, so that use has to be a deliberate change rather than a reach for a lighter grey.",
  },
  {
    pair: 'accent, success and warning against the page',
    because:
      'They are fills that carry text on top, never a standalone indicator. The thing that must be seen on its own, the focus ring, is accentText, which measures 6.11. This is already recorded in DESIGN.md and was the reason accentText exists.',
  },
  {
    pair: 'warningHover against anything',
    because:
      'No component paints it. accentHover and dangerHover used to be listed here too, and since SB-035 the Button paints both, because Figma 11:44 hovers Primary to accentHover and rests Destructive on dangerHover; they are declared above. warningHover waits for a warning control that hovers.',
  },
  {
    pair: "an information panel's bar and stroke, solid or dashed",
    because:
      'A supplementary cue. The design says dashed means incomplete, so a reader can see the edge of what we know without reading a word, and the eyebrow says the same thing in words: Not yet verified, This depends on your situation. The meaning never rests on the stroke alone (1.4.1), so it is not what identifies the panel (1.4.11).',
  },
  {
    pair: "a status tag's mark and stroke",
    because:
      'Decoration. Every tag says its status in words, so colour is never the only signal (1.4.1) and neither shape is what identifies it (1.4.11). They still clear 3:1 where it is easy to check: Blocked, the lowest, has danger on dangerSubtle at 3.30. The labels are declared above.',
  },
  {
    pair: 'white on danger, and on dangerPressed as its hover, the filled error control',
    because:
      "Nothing renders one. They were declared against MUI's palette.error until SB-035, and restoring danger to Figma's red/700 makes white on it 3.82, which is exactly why Figma's Destructive button rests on danger-hover instead, where white measures 4.81. A filled MUI error control, a Chip or a Badge, would have to be declared, and would fail, on the day one is used.",
  },
  {
    pair: 'text inside a warning notice, and inside a danger notice',
    because:
      'Same reason: theme.tokens only, and there is no notice component yet. A filled MUI Alert would NOT be this pair anyway, because it takes its text from getContrastText(main) rather than from a token we chose, which is a mismatch to declare deliberately when an Alert is first used.',
  },
  {
    pair: 'surfaceSubtle under anything but a secondary button',
    because:
      'The secondary button hovers and presses to it, which is declared above. The disabled button fill is surfaceSubtle too, under textTertiary, which WCAG 1.4.3 exempts as an inactive control. Nothing else paints it yet.',
  },
  {
    pair: "MUI's contained, outlined and text button variants",
    because:
      'Removed from the Button type in SB-035, so no call site can render one. The design has four styles by meaning, and those are declared above. Outlined and text also composited alpha(main, opacity) over their background, which is why they could never be two token lookups.',
  },
  {
    pair: 'borderStrong, warningBorder and dangerBorder against their grounds',
    because:
      "WCAG 1.4.11 asks 3:1 of a boundary only where the boundary is what identifies the control. borderStrong is now rendered, as the secondary button's stroke, and it is not that: a button with a text label is identified by its label, which Understanding 1.4.11 says in terms, so the stroke is decoration and is not held to 3:1. warningBorder and dangerBorder are still unrendered; classify each when something draws it.",
  },
  {
    pair: "the focus outline against a button's own fill",
    because:
      'The outline is drawn inside the button, as Figma draws its 2px focus stroke, so its inner edge meets the fill: accentText on accent measures 2.47 in light. Its outer edge meets the page, which is the adjacency 1.4.11 asks about, and that is declared above at 3:1. The stricter same-pixel change of 2.4.13 is AAA, and moving the outline outward would change the design, so that is a decision for the owner, not a quiet fix.',
  },
]
