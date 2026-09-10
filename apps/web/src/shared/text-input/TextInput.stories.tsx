import { Trans, useLingui } from '@lingui/react/macro'
import { Box, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FIELD_PAINT, FIELD_TEXT, dark, light, type ColourTokens, type FieldState } from 'src/core/theme'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TextInput } from './TextInput'

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

/** A token as the "r, g, b" run a computed box-shadow contains. */
const channels = (hex: string): string => {
  const packed = Number.parseInt(hex.slice(1), 16)
  return `${(packed >> 16) & 255}, ${(packed >> 8) & 255}, ${packed & 255}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

/** The design's own sample, with its copy following the language toolbar. */
const Passport = (props: { state?: 'filled' | 'disabled' | 'error'; onChange?: () => void; testId?: string }) => {
  const { t } = useLingui()
  const { state, onChange, testId } = props

  return (
    <TextInput
      data-testid={testId}
      label={<Trans>Passport number</Trans>}
      placeholder={t`Passport number`}
      helper={state === 'disabled' ? <Trans>Available once you confirm your nationality</Trans> : <Trans>As written in your passport, no spaces</Trans>}
      error={state === 'error' ? <Trans>Remove the dash, this field takes letters and numbers only</Trans> : undefined}
      disabled={state === 'disabled'}
      defaultValue={state === 'filled' ? 'U012345' : state === 'error' ? 'U0123-45' : undefined}
      onChange={onChange}
    />
  )
}

const meta = {
  title: 'Shared/TextInput',
  component: Passport,
  args: { onChange: fn() },
  argTypes: { state: { control: 'select', options: [undefined, 'filled', 'disabled', 'error'] } },
  // The design's sample is 320 wide; in a form the field fills its column.
  decorators: [(Story) => <Box sx={{ maxWidth: 320 }}>{Story()}</Box>],
} satisfies Meta<typeof Passport>

export default meta
type Story = StoryObj<typeof meta>

/** Typing reaches the handler. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const input = await within(canvasElement).findByRole('textbox', { name: /Passport number/ })
    await userEvent.type(input, 'U1')
    await expect(args.onChange).toHaveBeenCalled()
  },
}

/** The states that need no pointer, each against its tokens. */
// Resting paint is what States measures. A real pointer left over a control
// by an earlier story would hover it, so here nothing can be hovered.
export const States: Story = {
  render: () => (
    <Stack spacing={4} sx={{ pointerEvents: 'none' }}>
      <Passport testId="rest" />
      <Passport testId="filled" state="filled" />
      <Passport testId="disabled" state="disabled" />
      <Passport testId="error" state="error" />
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])
    const cases: [string, FieldState][] = [
      ['rest', 'rest'],
      ['filled', 'rest'],
      ['disabled', 'disabled'],
      ['error', 'error'],
    ]

    for (const [testId, state] of cases) {
      const want = FIELD_PAINT[state]
      const control = await canvas.findByTestId(testId)
      const field = control.querySelector('.MuiOutlinedInput-root')
      const outline = control.querySelector('.MuiOutlinedInput-notchedOutline')
      const input = control.querySelector('input')
      const helper = control.querySelector('.MuiFormHelperText-root')
      await expect(field && outline && input && helper).toBeTruthy()
      if (!field || !outline || !input || !helper) continue

      await expect(asHex(window.getComputedStyle(field).backgroundColor)).toBe(tokens[want.fill].toLowerCase())
      await expect(asHex(window.getComputedStyle(outline).borderTopColor)).toBe(tokens[want.stroke].toLowerCase())
      await expect(asHex(window.getComputedStyle(input).color)).toBe(tokens[want.value].toLowerCase())
      await expect(window.getComputedStyle(field).height).toBe('40px')

      // The helper, or the error in its place, is what the input is described by.
      await expect(input).toHaveAttribute('aria-describedby', helper.id)
      const helperColour = state === 'error' ? FIELD_TEXT.helperError : state === 'disabled' ? FIELD_TEXT.helperDisabled : FIELD_TEXT.helper
      await expect(asHex(window.getComputedStyle(helper).color)).toBe(tokens[helperColour].toLowerCase())
    }

    // The design's rule: the error REPLACES the helper, it does not stack under it.
    const error = await canvas.findByTestId('error')
    const input = error.querySelector('input')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(error.querySelectorAll('.MuiFormHelperText-root')).toHaveLength(1)
    await expect(error).not.toHaveTextContent(/As written in your passport/)
  },
}

/** Focus comes from MUI's onFocus, which a synthetic Tab does fire. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const tokens = tokensFor(globals['mode'])
    const input = await within(canvasElement).findByRole('textbox')
    await userEvent.tab()
    await expect(input).toHaveFocus()

    const field = input.closest('.MuiOutlinedInput-root')
    const outline = field?.querySelector('.MuiOutlinedInput-notchedOutline')
    await expect(field && outline).toBeTruthy()
    if (!field || !outline) return

    await expect(asHex(window.getComputedStyle(outline).borderTopColor)).toBe(tokens[FIELD_PAINT.focus.stroke].toLowerCase())
    // Still a 1px stroke: MUI thickens a focused outline to 2px, the design does not.
    await expect(window.getComputedStyle(outline).borderTopWidth).toBe('1px')
    await expect(window.getComputedStyle(field).boxShadow).toContain(channels(tokens[FIELD_TEXT.focusRing]))
  },
}

// Hover for LOOKING at: storybook/test's userEvent never applies :hover.
// Its stroke is proven in contrast.test.ts against what the theme emits.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
