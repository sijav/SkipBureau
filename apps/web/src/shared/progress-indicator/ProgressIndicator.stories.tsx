import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PROGRESS_PAINT, dark, light, segments, type ColourTokens } from 'src/core/theme'
import { expect, within } from 'storybook/test'
import { ProgressIndicator } from './ProgressIndicator'

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}


const meta = {
  title: 'Shared/ProgressIndicator',
  component: ProgressIndicator,
  args: { completed: 3, total: 9 },
  argTypes: { variant: { control: 'inline-radio', options: ['steps', 'bar'] } },
  // The design's sample is 360 wide.
  decorators: [(Story) => <Box sx={{ maxWidth: 360 }}>{Story()}</Box>],
} satisfies Meta<typeof ProgressIndicator>

export default meta
type Story = StoryObj<typeof meta>

/** The default: nine things you can count, not an abstract 33%. */
export const Steps: Story = {
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    const bar = await canvas.findByRole('progressbar')
    await expect(bar).toHaveAttribute('aria-valuenow', '3')
    await expect(bar).toHaveAttribute('aria-valuemax', '9')
    await expect(bar).toHaveAccessibleName('3 of 9 steps completed')

    const pieces = Array.from(bar.children)
    await expect(pieces).toHaveLength(9)
    const want = segments(3, 9)
    for (const [index, piece] of pieces.entries()) {
      const state = want[index]
      if (!state) continue
      await expect(asHex(window.getComputedStyle(piece).backgroundColor)).toBe(tokens[PROGRESS_PAINT[state]].toLowerCase())
      await expect(window.getComputedStyle(piece).height).toBe('8px')
    }
  },
}

/** For aggregate dashboards only, per the design. */
export const Bar: Story = {
  args: { variant: 'bar' },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    const bar = await canvas.findByRole('progressbar')
    await expect(bar).toHaveAccessibleName('3 of 9 steps completed')
    await expect(window.getComputedStyle(bar).height).toBe('6px')
    await expect(asHex(window.getComputedStyle(bar).backgroundColor)).toBe(tokens[PROGRESS_PAINT.remaining].toLowerCase())

    const fill = bar.firstElementChild
    await expect(fill).toBeTruthy()
    if (fill) await expect(asHex(window.getComputedStyle(fill).backgroundColor)).toBe(tokens[PROGRESS_PAINT.done].toLowerCase())
  },
}
