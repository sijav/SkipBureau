import { Trans } from '@lingui/react/macro'
import { Box, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { DocumentCard } from './DocumentCard'

const meta = {
  title: 'Shared/DocumentCard',
  component: DocumentCard,
  args: {
    state: 'notStarted',
    title: <Trans>Student certificate</Trans>,
    localName: 'Öğrenci belgesi',
    description: <Trans>Obtained from your university registrar. Must be dated within the last 30 days.</Trans>,
    flags: <Trans>Original · No translation · No apostille</Trans>,
  },
  argTypes: { state: { control: 'select', options: ['notStarted', 'ready', 'missing', 'expiring'] } },
  decorators: [(Story) => <Box sx={{ maxWidth: 360 }}>{Story()}</Box>],
} satisfies Meta<typeof DocumentCard>

export default meta
type Story = StoryObj<typeof meta>

/** The name, the name on the form, what it is, the flags in words, and the state: 178 high. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Not started')).toBeVisible()
    await expect(canvas.getByText('Öğrenci belgesi')).toBeVisible()
    const card = canvasElement.querySelector('[data-state="notStarted"]')
    await expect(window.getComputedStyle(card ?? canvasElement).height).toBe('178px')
  },
}

/** The four states side by side; missing and expiring say more than their word. */
export const States: Story = {
  render: (args) => (
    <Stack spacing={2}>
      <DocumentCard {...args} state="notStarted" />
      <DocumentCard {...args} state="ready" />
      <DocumentCard {...args} state="missing" status={<Trans>Missing, blocks step 4</Trans>} />
      <DocumentCard {...args} state="expiring" status={<Trans>Expires in 21 days</Trans>} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const words of ['Not started', 'Ready', 'Missing, blocks step 4', 'Expires in 21 days']) {
      await expect(await canvas.findByText(words)).toBeVisible()
    }
  },
}

/** Three times the copy grows the card and never spills out of it. */
export const Long: Story = {
  args: {
    title: <Trans>Certificate of enrolment for the current academic year, with the stamp of the faculty</Trans>,
    description: (
      <Trans>
        Obtained from your university registrar. Must be dated within the last 30 days, name the programme and its duration, and carry the
        stamp and signature of the faculty, not only of the international office.
      </Trans>
    ),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Not started')
    const card = canvasElement.querySelector('[data-state]')
    await expect(card?.scrollWidth).toBeLessThanOrEqual(card?.clientWidth ?? 0)
    await expect(card?.scrollHeight).toBeLessThanOrEqual(card?.clientHeight ?? 0)
  },
}

/** With only its name and state, it is still a card, and still says where it stands. */
export const Minimal: Story = {
  args: { localName: undefined, description: undefined, flags: undefined },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('Not started')).toBeVisible()
  },
}
