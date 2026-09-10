import { Trans } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { TaskTile } from './TaskTile'

const meta = {
  title: 'Shared/TaskTile',
  component: TaskTile,
  args: {
    to: '/en/tr/t/start-a-business',
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
    await expect(link).toHaveAttribute('href', '/en/tr/t/start-a-business')
    await expect(link.querySelectorAll('a, button')).toHaveLength(0)
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole('link')
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await expect(link).toHaveClass('Mui-focusVisible')
    await expect(window.getComputedStyle(link).outlineWidth).toBe('2px')
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
