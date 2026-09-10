import { Trans } from '@lingui/react/macro'
import { Button, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BUTTON_PAINT, BUTTON_VARIANTS, dark, light, type ButtonFill, type ColourTokens } from 'src/core/theme'
import { expect, fn, userEvent, within } from 'storybook/test'

// MUI's own Button. Every colour here comes from src/core/theme/button.ts,
// which the theme turns into the four variants, so there is no component file.

/**
 * A computed colour as the token it should equal. The comparison goes this way
 * round so the story never spells a colour itself: tokens.test.ts fails any
 * colour literal outside tokens.ts, and that includes one built for a test.
 */
const asToken = (computed: string): string => {
  const [red = 0, green = 0, blue = 0, alpha = 1] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  if (alpha === 0) return 'transparent'
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const expected = (tokens: ColourTokens, fill: ButtonFill): string => (fill === 'transparent' ? 'transparent' : tokens[fill].toLowerCase())

/** The toolbar's mode, with `system` resolved the way the theme resolves it. */
const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

const meta = {
  title: 'Shared/Button',
  component: Button,
  args: { variant: 'primary', disabled: false, onClick: fn(), children: <Trans>Start this process</Trans> },
  argTypes: {
    variant: { control: 'inline-radio', options: BUTTON_VARIANTS },
    children: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Driven by the Controls panel. Clicking has to reach the handler. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: /Start this process|این فرایند را شروع کنید/ }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

/**
 * Every style at rest and disabled, the two rows of the design that need no
 * pointer. axe checks all eight in each of the four combinations.
 */
export const Styles: Story = {
  render: (args) => (
    <Stack spacing={2}>
      {BUTTON_VARIANTS.map((variant) => (
        <Stack key={variant} direction="row" spacing={2}>
          <Button {...args} variant={variant} data-testid={`${variant}-rest`} />
          <Button {...args} variant={variant} disabled data-testid={`${variant}-disabled`} />
        </Stack>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    for (const variant of BUTTON_VARIANTS) {
      const want = BUTTON_PAINT[variant]
      const rest = window.getComputedStyle(await canvas.findByTestId(`${variant}-rest`))
      await expect(asToken(rest.backgroundColor)).toBe(expected(tokens, want.rest))
      await expect(asToken(rest.color)).toBe(expected(tokens, want.label))
      await expect(asToken(rest.borderTopColor)).toBe(expected(tokens, want.stroke))

      // One height for every style: the stroke is inside the 40px, as in Figma.
      await expect(rest.height).toBe('40px')

      const disabled = window.getComputedStyle(await canvas.findByTestId(`${variant}-disabled`))
      await expect(asToken(disabled.backgroundColor)).toBe(expected(tokens, want.disabledFill))
      await expect(asToken(disabled.color)).toBe(expected(tokens, 'textTertiary'))
    }
  },
}

/**
 * Keyboard focus. MUI marks it with a class from the keydown it sees, so a
 * synthetic Tab is enough here, unlike hover and press.
 */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const button = await within(canvasElement).findByRole('button')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(button).toHaveClass('Mui-focusVisible')

    const style = window.getComputedStyle(button)
    await expect(asToken(style.outlineColor)).toBe(expected(tokensFor(globals['mode']), 'accentText'))
    await expect(style.outlineWidth).toBe('2px')
    // Inside the button, as Figma draws it, so focusing moves nothing.
    await expect(style.outlineOffset).toBe('-2px')
  },
}

// Hover and press, for LOOKING at. They are excluded from the test run on
// purpose: storybook/test's userEvent is synthetic and a probe showed it never
// applies :hover or :active, and the pseudo-states addon only works inside the
// Storybook UI. Their colours are proven in contrast.test.ts against what the
// theme actually emits, in both modes.
const everyStyle: Story['render'] = (args) => (
  <Stack direction="row" spacing={2}>
    {BUTTON_VARIANTS.map((variant) => (
      <Button key={variant} {...args} variant={variant} />
    ))}
  </Stack>
)

export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } }, render: everyStyle }
export const Pressed: Story = { tags: ['!test'], parameters: { pseudo: { active: true } }, render: everyStyle }
