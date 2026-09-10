import { Trans } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { FactStrip } from './FactStrip'

const meta = {
  title: 'Shared/FactStrip',
  component: FactStrip,
  args: {
    facts: [
      { label: <Trans>Typical cost</Trans>, value: <Trans>Varies by company type and situation</Trans> },
      { label: <Trans>Typical setup time</Trans>, value: <Trans>Varies by company type and situation</Trans> },
      { label: <Trans>Key deadlines</Trans>, value: <Trans>Set once the structure is chosen</Trans> },
    ],
  },
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
} satisfies Meta<typeof FactStrip>

export default meta
type Story = StoryObj<typeof meta>

/** A term and its value per column, read as a description list. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/Typical cost/)).toBeVisible()
    // Testing Library's role table has no role for dt and dd, so the list is read as markup.
    await expect(canvasElement.querySelectorAll('dl > div > dt')).toHaveLength(3)
    await expect(canvasElement.querySelectorAll('dl > div > dd')).toHaveLength(3)
  },
}

/** Deadlines have their own toggle; without them, two columns. */
export const TwoColumns: Story = {
  args: {
    facts: [
      { label: <Trans>Typical cost</Trans>, value: <Trans>Varies by operator, plan, SIM type and campaign</Trans> },
      { label: <Trans>Typical setup time</Trans>, value: <Trans>Usually a short visit in store</Trans> },
    ],
  },
}
