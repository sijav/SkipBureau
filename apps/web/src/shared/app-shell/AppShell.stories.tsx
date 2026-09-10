import { Trans } from '@lingui/react/macro'
import { Box, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Page } from 'src/shared/page'
import { AppShell } from './AppShell'

// Slots only. What goes in the header, and how it collapses, is SB-038.

const Band = ({ label }: { label: string }) => (
  <Box sx={{ bgcolor: 'action.hover', py: 2 }}>
    <Page>
      <Typography variant="body2">{label}</Typography>
    </Page>
  </Box>
)

const meta = {
  title: 'Shared/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  argTypes: { children: { control: false }, header: { control: false }, footer: { control: false } },
  args: {
    header: <Band label="header" />,
    footer: <Band label="footer" />,
    children: (
      <Page>
        <Typography variant="h4" component="h1" sx={{ py: 4 }}>
          <Trans>The page goes here</Trans>
        </Typography>
      </Page>
    ),
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The footer sits after the main content, which is what a flex column with
    // a growing main gives you, and what a short page on a phone needs.
    await expect(await canvas.findByText('footer')).toBeVisible()
    await expect(canvasElement.querySelector('main')).not.toBeNull()
  },
}

export const NoChrome: Story = {
  args: { header: undefined, footer: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('header')).toBeNull()
  },
}
