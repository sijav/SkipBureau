import { Trans } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { expect, userEvent, within } from 'storybook/test'
import { ProcessCard } from './ProcessCard'

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

/** A computed colour as the token's hex, so the check names no colour of its own. */
const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const meta = {
  title: 'Shared/ProcessCard',
  component: ProcessCard,
  args: {
    to: '/en/TR/setup/start-a-business',
    title: <Trans>Start a company in Turkey</Trans>,
    facts: <Trans>9 steps · 2–4 weeks · ₺14,000–22,000</Trans>,
    pitch: <Trans>Answer 10 questions and get a roadmap built for your nationality and city.</Trans>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Box sx={{ maxWidth: 360 }}>{Story()}</Box>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ProcessCard>

export default meta
type Story = StoryObj<typeof meta>

/** Cost and duration up front, in Figma's own words, then the pitch: 158 high. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByRole('link', { name: /Start a company in Turkey/ })
    await expect(card).toHaveTextContent(/Guided process/)
    await expect(window.getComputedStyle(card).height).toBe('158px')
  },
}

/** Under way: the track and the next action in place of the pitch, 150 high, the accent border. */
export const InProgress: Story = {
  args: { progress: { completed: 3, total: 9, next: <Trans>prepare notarised passport translation</Trans> } },
  play: async ({ canvasElement, globals }) => {
    const card = await within(canvasElement).findByRole('link')
    await expect(card).toHaveTextContent(/In progress/)
    await expect(card).toHaveTextContent(/Next: prepare notarised passport translation/)
    await expect(card).not.toHaveTextContent(/Answer 10 questions/)
    await expect(window.getComputedStyle(card).height).toBe('150px')
    await expect(asHex(window.getComputedStyle(card).borderTopColor)).toBe(tokensFor(globals['mode']).accent.toLowerCase())
  },
}

/** Three times the copy grows the card and never spills out of it. */
export const Long: Story = {
  args: {
    title: <Trans>Start a limited company in Turkey with a foreign shareholder and a local director</Trans>,
    pitch: (
      <Trans>
        Answer 10 questions and get a roadmap built for your nationality and city, including the trade registry, the tax office, the bank
        and the social security registration for your first employee.
      </Trans>
    ),
  },
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByRole('link')
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth)
    await expect(card.scrollHeight).toBeLessThanOrEqual(card.clientHeight)
  },
}

/** Without its optional pitch it still states what it costs and how long it takes. */
export const NoPitch: Story = {
  args: { pitch: undefined },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('link')).toHaveTextContent(/9 steps/)
  },
}

/** The family's focus: the resting card and a 2px accent-text outline. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const card = await within(canvasElement).findByRole('link')
    await userEvent.tab()
    await expect(card).toHaveFocus()
    const style = window.getComputedStyle(card)
    await expect(style.outlineWidth).toBe('2px')
    await expect(asHex(style.outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
  },
}

// For LOOKING at: synthetic events never apply :hover.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
