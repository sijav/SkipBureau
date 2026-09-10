import { Trans } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { ComingSoon } from './ComingSoon'

/** What every unbuilt destination lands on: what will be here, and a way back. */
const meta = {
  title: 'Screens/ComingSoon',
  component: ComingSoon,
  parameters: { layout: 'fullscreen' },
  args: {
    title: <Trans>Guided setup</Trans>,
    children: <Trans>A few questions about your situation, then only the steps that apply to you, in the order they come.</Trans>,
    back: { to: '/en/TR/tasks/start-a-business', label: <Trans>Back to the overview</Trans> },
  },
  decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>],
} satisfies Meta<typeof ComingSoon>

export default meta
type Story = StoryObj<typeof meta>

/** Says it is coming, names what, and leads back rather than nowhere. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1, name: /Guided setup/ })).toBeVisible()
    await expect(canvas.getByText(/Coming soon/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Back to the overview/ })).toHaveAttribute('href', '/en/TR/tasks/start-a-business')
  },
}
