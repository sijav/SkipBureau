import { Trans } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { expect, userEvent, within } from 'storybook/test'
import { GuideCard } from './GuideCard'

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
  title: 'Shared/GuideCard',
  component: GuideCard,
  args: {
    to: '/en/TR/guides/student-residence-permit',
    category: <Trans>Residence and immigration</Trans>,
    title: <Trans>Student residence permit</Trans>,
    description: <Trans>What you need, what it costs, and the two document mistakes that cause most refusals.</Trans>,
    verifiedAt: '2026-08-24',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Box sx={{ maxWidth: 360 }}>{Story()}</Box>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof GuideCard>

export default meta
type Story = StoryObj<typeof meta>

/** The whole card is the link: 154 high as drawn, the date part of the card. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByRole('link', { name: /Student residence permit/ })
    await expect(card).toHaveAttribute('href', '/en/TR/guides/student-residence-permit')
    await expect(card).toHaveTextContent(/Verified Aug 2026/)
    await expect(window.getComputedStyle(card).height).toBe('154px')
  },
}

/** Three times the copy grows the card and never spills out of it. */
export const Long: Story = {
  args: {
    title: <Trans>Student residence permit for a second degree, an exchange term, or a language course at a private school</Trans>,
    description: (
      <Trans>
        What you need, what it costs, and the two document mistakes that cause most refusals, including the translation and the insurance
        that has to cover the whole permit, and what to do when the university is late with the certificate.
      </Trans>
    ),
  },
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByRole('link')
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth)
    await expect(card.scrollHeight).toBeLessThanOrEqual(card.clientHeight)
  },
}

/** Without its optional sentence it is the eyebrow, the title and the date. */
export const NoDescription: Story = {
  args: { description: undefined },
  play: async ({ canvasElement }) => {
    const card = await within(canvasElement).findByRole('link')
    await expect(card).toHaveTextContent(/Verified Aug 2026/)
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
