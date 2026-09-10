import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { InformationDisclaimer } from './InformationDisclaimer'

const meta = {
  title: 'Shared/InformationDisclaimer',
  component: InformationDisclaimer,
  args: { country: 'Turkey' },
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
} satisfies Meta<typeof InformationDisclaimer>

export default meta
type Story = StoryObj<typeof meta>

/** A standing note, not an alert: nothing about it is announced. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/For general information only/)).toBeVisible()
    await expect(canvas.queryByRole('alert')).toBeNull()
  },
}
