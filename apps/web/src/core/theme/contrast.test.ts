import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { buttonRoot, buttonVariants } from './button'
import { DECLARED, EXEMPT, contrastRatio, type Token } from './contrast'
import { appTheme } from './theme'
import { dark, light } from './tokens'

const MODES = [
  ['light', light],
  ['dark', dark],
] as const

/** What a control with no fill of its own can sit on. */
const GROUNDS: readonly Token[] = ['background', 'surface']

test('every declared pair meets its contrast target, in both modes', () => {
  const missed: string[] = []

  for (const [mode, tokens] of MODES) {
    for (const { role, fore, back, target } of DECLARED) {
      const measured = contrastRatio(tokens[fore], tokens[back])
      if (measured >= target) continue

      missed.push(
        `${mode}: ${role} is ${measured.toFixed(2)}:1, needs ${target}:1 (${fore} ${tokens[fore]} on ${back} ${tokens[back]})`,
      )
    }
  }

  assert.deepEqual(missed, [], `A reader cannot read these:\n  ${missed.join('\n  ')}`)
})

test('the contrast ratio is the WCAG one, checked against values with known answers', () => {
  // Black on white is 21:1 and anything on itself is 1:1. Without these the
  // test above is only self consistent: a broken formula returning 99 for
  // everything would pass it and prove nothing.
  assert.equal(contrastRatio('#000000', '#FFFFFF').toFixed(2), '21.00')
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF').toFixed(2), '1.00')
  assert.equal(contrastRatio('#777777', '#FFFFFF').toFixed(2), '4.48')

  // Order must not matter.
  assert.equal(contrastRatio('#1D2421', '#F8FAF8'), contrastRatio('#F8FAF8', '#1D2421'))
})

/**
 * Adding a variant to `Painted` without handling it below is a TYPE error, not
 * a silently skipped case. A plain switch is not exhaustive just because its
 * discriminant is a union: `noFallthroughCasesInSwitch` only catches accidental
 * fallthrough, so a new variant would compile and quietly check nothing, which
 * is this file's own history.
 */
const assertNever = (value: never): never => {
  throw new Error(`unhandled paint source: ${JSON.stringify(value)}`)
}

test('every pair is bound to the slot that paints it', () => {
  // No filter. `painted` is required, so there is nothing to skip: a pair that
  // declined to say where it was painted used to be contrast tested, never
  // bound, and green.
  for (const [mode, tokens] of MODES) {
    const { palette } = appTheme(mode, 'ltr')

    for (const { role, fore, back, painted } of DECLARED) {
      switch (painted.by) {
        case 'palette':
          // The gap this closes: warning.contrastText was warningText, which is
          // for text on the SUBTLE fill and measures 2.82 on the amber itself.
          assert.equal(
            palette[painted.entry][painted.fill],
            tokens[back],
            `${mode}: ${role} is painted from ${painted.entry}.${painted.fill}`,
          )
          assert.equal(
            palette[painted.entry].contrastText,
            tokens[fore],
            `${mode}: ${role} takes its text from ${painted.entry}.contrastText`,
          )
          break

        case 'text':
          assert.equal(palette.background[painted.back], tokens[back], `${mode}: ${role} sits on background.${painted.back}`)
          assert.equal(palette.text[painted.fore], tokens[fore], `${mode}: ${role} is text.${painted.fore}`)
          break

        case 'button': {
          const emitted = buttonVariants(tokens).find((entry) => entry.props.variant === painted.variant)
          assert.ok(emitted, `${mode}: no ${painted.variant} button variant is emitted`)
          const { style } = emitted
          const fill =
            painted.state === 'rest'
              ? style.backgroundColor
              : painted.state === 'hover'
                ? style['@media (hover: hover)']['&:hover'].backgroundColor
                : style['&:active'].backgroundColor

          // Ghost at rest paints nothing, so its label sits on whatever ground
          // it is placed on, and the declaration has to name one.
          if (fill === 'transparent') assert.ok(GROUNDS.includes(back), `${mode}: ${role} has no fill of its own, so it is declared on a ground`)
          else assert.equal(fill, tokens[back], `${mode}: ${role} is the ${painted.variant} ${painted.state} fill`)

          assert.equal(style.color, tokens[fore], `${mode}: ${role} is the ${painted.variant} label colour`)
          break
        }

        case 'focus':
          assert.equal(buttonRoot(tokens)['&.Mui-focusVisible'].outlineColor, tokens[fore], `${mode}: ${role} is the focus outline colour`)
          assert.ok(GROUNDS.includes(back), `${mode}: ${role} is measured against a ground`)
          break

        default:
          assertNever(painted)
      }
    }
  }
})

/**
 * The bindings above read button.ts. This proves that is what MUI is actually
 * given, so the inventory cannot be checked against a table the theme has
 * stopped using.
 */
test('the theme hands MUI exactly the button styles the inventory is checked against', () => {
  for (const [mode, tokens] of MODES) {
    const root = appTheme(mode, 'ltr').components?.MuiButton?.styleOverrides?.root
    assert.deepEqual(root, { ...buttonRoot(tokens), variants: buttonVariants(tokens) }, `${mode}: MuiButton's root styles drifted from button.ts`)
  }
})

test('an exemption is a written decision, not an omission', () => {
  // Anything left out of DECLARED has to say why in EXEMPT. Otherwise the next
  // person cannot tell a considered exemption from a pair somebody forgot, and
  // the honest reading of a green run stops being available.
  assert.ok(EXEMPT.length > 0)

  for (const { pair, because } of EXEMPT) {
    assert.ok(pair.length > 0)
    assert.ok(because.length > 40, `"${pair}" is exempt without a reason anyone could weigh`)
  }
})
