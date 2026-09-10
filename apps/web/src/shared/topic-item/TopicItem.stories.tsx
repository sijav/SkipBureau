import { Trans } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { TopicItem } from './TopicItem'

const meta = {
  title: 'Shared/TopicItem',
  component: TopicItem,
  args: {
    to: '/en/TR/tasks/start-a-business/register-your-company',
    title: <Trans>Register your company</Trans>,
    description: <Trans>Understand the registration process and what needs to be prepared.</Trans>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Box sx={{ maxWidth: 860 }}>{Story()}</Box>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TopicItem>

export default meta
type Story = StoryObj<typeof meta>

/** The whole row is the link, 82 high, ruled underneath. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const row = await within(canvasElement).findByRole('link', { name: /Register your company/ })
    await expect(row).toHaveAttribute('href', '/en/TR/tasks/start-a-business/register-your-company')
    await expect(window.getComputedStyle(row).height).toBe('82px')
    await expect(window.getComputedStyle(row).borderBottomWidth).toBe('1px')
  },
}

/** A kind label makes the row 100. */
export const WithKind: Story = {
  args: {
    kind: <Trans>Decision</Trans>,
    title: <Trans>Choose a company type</Trans>,
    description: <Trans>Understand the main company structures and which situations they are commonly used for.</Trans>,
  },
  play: async ({ canvasElement }) => {
    const row = await within(canvasElement).findByRole('link')
    await expect(row).toHaveTextContent(/Decision/)
    await expect(window.getComputedStyle(row).height).toBe('100px')
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const row = await within(canvasElement).findByRole('link')
    await userEvent.tab()
    await expect(row).toHaveFocus()
    await expect(window.getComputedStyle(row).outlineWidth).toBe('2px')
  },
}

// For LOOKING at: synthetic events never apply :hover or :active.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
export const Pressed: Story = { tags: ['!test'], parameters: { pseudo: { active: true } } }

/** Leading nowhere yet: recessed, no arrow, not a link. */
export const Unavailable: Story = {
  args: { to: undefined, unavailable: true, kind: <Trans>Coming soon</Trans> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('link')).toBeNull()
    await expect(await canvas.findByText(/Coming soon/)).toBeVisible()
  },
}
