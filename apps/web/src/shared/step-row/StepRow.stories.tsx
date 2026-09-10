import { Trans } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { StepRow } from './StepRow'

const meta = {
  title: 'Shared/StepRow',
  component: StepRow,
  args: {
    number: 5,
    title: <Trans>Activate and test it</Trans>,
    description: <Trans>Check mobile data, calls, SMS and your new number before you leave the store.</Trans>,
  },
  decorators: [
    (Story) => (
      <Box component="ol" sx={{ maxWidth: 720, margin: 0, padding: 0 }}>
        {Story()}
      </Box>
    ),
  ],
} satisfies Meta<typeof StepRow>

export default meta
type Story = StoryObj<typeof meta>

/** Numbered in two digits, the title a heading a screen reader can jump between. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 3, name: /Activate and test it/ })).toBeVisible()
    await expect(canvas.getByText('05')).toBeVisible()
  },
}

export const WithNote: Story = {
  args: { note: <Trans>A working SIM does not mean a registered device.</Trans> },
}
