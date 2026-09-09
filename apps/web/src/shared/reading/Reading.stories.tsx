import { Trans } from '@lingui/react/macro'
import Typography from '@mui/material/Typography'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Reading } from './Reading'

const meta = {
  title: 'Shared/Reading',
  component: Reading,
  argTypes: { children: { control: false } },
  args: {
    children: (
      <Typography data-testid="prose">
        <Trans>
          The reading measure is 720. The design gives a reason for that one number and for no other, so it is the only
          width here that is about how text reads rather than about how a screen is divided.
        </Trans>
      </Typography>
    ),
  },
} satisfies Meta<typeof Reading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const prose = await within(canvasElement).findByTestId('prose')
    await expect(prose.getBoundingClientRect().width).toBeLessThanOrEqual(720)
  },
}
