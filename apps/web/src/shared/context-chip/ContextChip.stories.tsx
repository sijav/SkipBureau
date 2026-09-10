import { Trans } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CHIP_PAINT, dark, light, type ColourTokens } from 'src/core/theme'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ContextChip } from './ContextChip'

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

/** The design's sample, with its copy following the language toolbar. */
const Nationality = ({ set = true, onClick, testId }: { set?: boolean; onClick?: () => void; testId?: string }) => (
  <ContextChip
    data-testid={testId}
    name={<Trans>Nationality</Trans>}
    value={set ? <Trans>Iranian</Trans> : undefined}
    prompt={<Trans>Add to sharpen answers</Trans>}
    onClick={() => onClick?.()}
  />
)

const meta = {
  title: 'Shared/ContextChip',
  component: Nationality,
  args: { set: true, onClick: fn() },
} satisfies Meta<typeof Nationality>

export default meta
type Story = StoryObj<typeof meta>

/** A button, named by the question and the answer, and it opens the editor. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const chip = await within(canvasElement).findByRole('button', { name: /Nationality\s*Iranian|ملیت\s*ایرانی/i })
    await userEvent.click(chip)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

/** Set and unset, against their tokens. */
export const States: Story = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <Nationality testId="set" />
      <Nationality testId="unset" set={false} />
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    for (const state of ['set', 'unset'] as const) {
      const want = CHIP_PAINT[state]
      const chip = await canvas.findByTestId(state)
      const style = window.getComputedStyle(chip)
      await expect(asHex(style.backgroundColor)).toBe(tokens[want.fill].toLowerCase())
      await expect(asHex(style.borderTopColor)).toBe(tokens[want.stroke].toLowerCase())
      await expect(style.borderTopStyle).toBe(want.dashed ? 'dashed' : 'solid')
      // 26px, with the stroke inside as Figma draws it.
      await expect(style.height).toBe('26px')

      const [key, value] = Array.from(chip.children)
      if (key) await expect(asHex(window.getComputedStyle(key).color)).toBe(tokens[want.key].toLowerCase())
      if (value) await expect(asHex(window.getComputedStyle(value).color)).toBe(tokens[want.value].toLowerCase())
    }

    // Unset says what to do, not just that something is missing.
    await expect(await canvas.findByTestId('unset')).toHaveTextContent(/Add to sharpen answers|برای پاسخ دقیق‌تر اضافه کنید/)
  },
}

/** The system's inward focus outline; the design draws none of its own. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const chip = await within(canvasElement).findByRole('button')
    await userEvent.tab()
    await expect(chip).toHaveFocus()
    await expect(chip).toHaveClass('Mui-focusVisible')
    const style = window.getComputedStyle(chip)
    await expect(asHex(style.outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
    await expect(style.outlineOffset).toBe('-2px')
  },
}

// Hover for LOOKING at: storybook/test's userEvent never applies :hover.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
