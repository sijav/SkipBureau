import { Trans } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { expect, userEvent, within } from 'storybook/test'
import { TaskTile } from './TaskTile'

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
  title: 'Shared/TaskTile',
  component: TaskTile,
  args: {
    to: '/en/TR/tasks/start-a-business',
    title: <Trans>Start a business</Trans>,
    description: <Trans>Company types, registration and first obligations</Trans>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Stack sx={{ maxWidth: 302 }}>{Story()}</Stack>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TaskTile>

export default meta
type Story = StoryObj<typeof meta>

/** The whole tile is the link, with nothing clickable inside it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole('link', { name: /Start a business/ })
    await expect(link).toHaveAttribute('href', '/en/TR/tasks/start-a-business')
    await expect(link.querySelectorAll('a, button')).toHaveLength(0)
  },
}

/** The row family's focus, SB-037: a 2px accent-text outline on the resting surface. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const link = await within(canvasElement).findByRole('link')
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await expect(link).toHaveClass('Mui-focusVisible')
    await expect(window.getComputedStyle(link).outlineWidth).toBe('2px')
    await expect(asHex(window.getComputedStyle(link).outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
  },
}

/** Unavailable: recessed, no arrow, and not a link at all. */
export const ComingSoon: Story = {
  args: { comingSoon: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('link')).toBeNull()
    await expect(await canvas.findByText(/Coming soon/)).toBeVisible()
  },
}

// For LOOKING at: synthetic events never apply :hover or :active.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
export const Pressed: Story = { tags: ['!test'], parameters: { pseudo: { active: true } } }
