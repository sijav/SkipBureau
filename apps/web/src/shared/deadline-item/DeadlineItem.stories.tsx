import { Trans } from '@lingui/react/macro'
import { Box, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { expect, userEvent, within } from 'storybook/test'
import { DeadlineItem } from './DeadlineItem'

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
  title: 'Shared/DeadlineItem',
  component: DeadlineItem,
  args: { state: 'normal', title: <Trans>Residence permit renewal</Trans>, date: '2026-10-15', days: 47 },
  argTypes: { state: { control: 'select', options: ['normal', 'upcoming', 'dueSoon', 'today', 'overdue', 'completed'] } },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Box sx={{ maxWidth: 380 }}>{Story()}</Box>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof DeadlineItem>

export default meta
type Story = StoryObj<typeof meta>

/** 66 high, the date as the design writes one, and the days left. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('47 days')).toBeVisible()
    await expect(canvas.getByText('15 Oct 2026')).toBeVisible()
    const item = canvasElement.querySelector('[data-state="normal"]')
    await expect(window.getComputedStyle(item ?? canvasElement).height).toBe('66px')
  },
}

/** Six states, three steps of urgency: neutral, amber from Due soon, red once overdue. */
export const States: Story = {
  render: () => (
    <Stack spacing={2}>
      <DeadlineItem state="normal" title={<Trans>Residence permit renewal</Trans>} date="2026-10-15" days={47} />
      <DeadlineItem state="upcoming" title={<Trans>Tax filing, Q3</Trans>} date="2026-09-20" days={21} />
      <DeadlineItem state="dueSoon" title={<Trans>Health insurance renewal</Trans>} date="2026-09-07" days={6} />
      <DeadlineItem state="today" title={<Trans>Appointment at the migration office</Trans>} date="2026-09-01" />
      <DeadlineItem state="overdue" title={<Trans>Address registration</Trans>} date="2026-08-23" days={9} />
      <DeadlineItem state="completed" title={<Trans>Tax number obtained</Trans>} date="2026-08-12" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const words of ['47 days', '21 days', '6 days', 'Today', '9 days late', 'Done']) {
      await expect(await canvas.findByText(words)).toBeVisible()
    }
    for (const item of canvasElement.querySelectorAll('[data-state]')) {
      await expect(window.getComputedStyle(item).height).toBe('66px')
    }
  },
}

/** Where it leads somewhere, the whole item is the link, with the family's focus. */
export const Focus: Story = {
  args: { to: '/en/TR/tasks/getting-settled' },
  play: async ({ canvasElement, globals }) => {
    const link = await within(canvasElement).findByRole('link', { name: /Residence permit renewal/ })
    await userEvent.tab()
    await expect(link).toHaveFocus()
    const style = window.getComputedStyle(link)
    await expect(style.outlineWidth).toBe('2px')
    await expect(asHex(style.outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
  },
}

// For LOOKING at: synthetic events never apply :hover.
export const Hover: Story = { tags: ['!test'], args: { to: '/en/TR/tasks/getting-settled' }, parameters: { pseudo: { hover: true } } }
