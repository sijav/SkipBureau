import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SOURCE_PAINT, SOURCE_STATES, dark, light, type ColourTokens } from 'src/core/theme'
import { expect, within } from 'storybook/test'
import { SourceCard } from './SourceCard'

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

// Content, as the API would send it: names are data, not interface text.
const SAMPLE = { publisher: 'Republic of Türkiye', institution: 'Presidency of Migration Management', url: 'https://www.goc.gov.tr/', checkedAt: '2026-08-24' }

const meta = {
  title: 'Shared/SourceCard',
  component: SourceCard,
  args: { state: 'verified', ...SAMPLE },
  argTypes: { state: { control: 'select', options: SOURCE_STATES } },
  decorators: [(Story) => <Stack sx={{ maxWidth: 520 }}>{Story()}</Stack>],
} satisfies Meta<typeof SourceCard>

export default meta
type Story = StoryObj<typeof meta>

/** The institution is named, the check is dated, and the source opens outside the site. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/Official source/)).toBeVisible()
    await expect(canvas.getByText(/Last checked 24 Aug 2026/)).toBeVisible()
    const visit = canvas.getByRole('link', { name: /Visit official source/ })
    await expect(visit).toHaveAttribute('href', SAMPLE.url)
    await expect(visit).toHaveAttribute('target', '_blank')
    await expect(visit).toHaveAttribute('rel', 'noreferrer')
  },
}

/** The five states of Figma 30:84, each against its tokens. */
export const States: Story = {
  render: (args) => (
    <Stack spacing={2}>
      {SOURCE_STATES.map((state) => (
        <SourceCard key={state} {...args} state={state} data-testid={state} />
      ))}
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    for (const state of SOURCE_STATES) {
      const card = await canvas.findByTestId(state)
      const style = window.getComputedStyle(card)
      await expect(asHex(style.backgroundColor)).toBe(tokens[SOURCE_PAINT[state].fill].toLowerCase())
      await expect(asHex(style.borderTopColor)).toBe(tokens[SOURCE_PAINT[state].stroke].toLowerCase())
      const eyebrow = card.querySelector('.source-eyebrow')
      if (eyebrow) await expect(asHex(window.getComputedStyle(eyebrow).color)).toBe(tokens[SOURCE_PAINT[state].signal].toLowerCase())
    }

    // An unavailable page is not offered as a link.
    await expect(within(await canvas.findByTestId('unavailable')).queryByRole('link')).toBeNull()
  },
}
