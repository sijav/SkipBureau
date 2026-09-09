import { Trans } from '@lingui/react/macro'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Page } from './Page'

// Resize the Storybook canvas to see the point of this component: the column
// keeps its cap and the inset steps down, so nothing ever needs a horizontal
// scrollbar.

const Ruler = () => {
  const { layout } = useTheme()

  return (
    <Stack spacing={2} sx={{ py: 4 }}>
      <Typography variant="h4" component="h1">
        <Trans>A column, not a width</Trans>
      </Typography>
      <Box
        data-testid="ruler"
        sx={{ height: 48, bgcolor: 'primary.main', borderRadius: 1 }}
      />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        <Trans>Cap</Trans>: {layout.contentWidth}
      </Typography>
    </Stack>
  )
}

const meta = {
  title: 'Shared/Page',
  component: Page,
  parameters: { layout: 'fullscreen' },
  argTypes: { width: { control: 'inline-radio', options: ['content', 'main'] }, children: { control: false } },
  args: { width: 'content', children: <Ruler /> },
} satisfies Meta<typeof Page>

export default meta
type Story = StoryObj<typeof meta>

export const Content: Story = {
  play: async ({ canvasElement }) => {
    const ruler = await within(canvasElement).findByTestId('ruler')
    // The cap holds, and nothing spills past the viewport.
    await expect(ruler.getBoundingClientRect().width).toBeLessThanOrEqual(1280)
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth)
  },
}

export const Main: Story = {
  args: { width: 'main' },
  play: async ({ canvasElement }) => {
    const ruler = await within(canvasElement).findByTestId('ruler')
    await expect(ruler.getBoundingClientRect().width).toBeLessThanOrEqual(1080)
  },
}
