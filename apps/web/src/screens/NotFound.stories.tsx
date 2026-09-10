import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { NotFound } from './NotFound'

// The message is the assertion, not the presence of an element. A story that
// only checks something rendered is how two screens end up saying the same
// thing to a reader who needed to be told different things.

const meta = {
  title: 'Screens/NotFound',
  component: NotFound,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NotFound>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Either language, because the toolbar drives which one renders.
    await expect(await canvas.findByRole('heading', { level: 1 })).toHaveTextContent(/does not exist|وجود ندارد/)

    // It has to say WHY, or a reader cannot tell a typo from a place we have
    // not covered yet, and those need different next steps.
    await expect(await canvas.findByText(/does not cover yet|پوشش نمی‌دهد/)).toBeVisible()
  },
}
