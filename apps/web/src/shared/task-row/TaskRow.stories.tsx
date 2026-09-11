import { Trans } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { expect, userEvent, within } from 'storybook/test'
import { TaskRow } from './TaskRow'

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
  title: 'Shared/TaskRow',
  component: TaskRow,
  args: {
    to: '/en/TR/tasks/start-a-business',
    title: <Trans>Start a business</Trans>,
    description: <Trans>Company types, registration, first obligations</Trans>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Box sx={{ maxWidth: 560 }}>{Story()}</Box>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TaskRow>

export default meta
type Story = StoryObj<typeof meta>

/** The whole row is the link: 70 high, ruled underneath, the rule inside. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const row = await within(canvasElement).findByRole('link', { name: /Start a business/ })
    await expect(row).toHaveAttribute('href', '/en/TR/tasks/start-a-business')
    await expect(window.getComputedStyle(row).height).toBe('70px')
    await expect(window.getComputedStyle(row).borderBottomWidth).toBe('1px')
  },
}

/** The family's focus: the resting surface and a 2px accent-text outline. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const row = await within(canvasElement).findByRole('link')
    await userEvent.tab()
    await expect(row).toHaveFocus()
    const style = window.getComputedStyle(row)
    await expect(style.outlineWidth).toBe('2px')
    await expect(asHex(style.outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
  },
}

// For LOOKING at: synthetic events never apply :hover.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
