import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { TileGrid } from './TileGrid'

// Twelve, because that is how many goals Home has. Narrow the canvas and the
// four columns become two, then one.

const tiles = Array.from({ length: 12 }, (_, index) => index + 1)

const meta = {
  title: 'Shared/TileGrid',
  component: TileGrid,
  parameters: { layout: 'fullscreen' },
  argTypes: { columns: { control: 'inline-radio', options: [2, 3, 4] }, children: { control: false } },
  args: {
    columns: 4,
    children: tiles.map((n) => (
      <Box key={n} data-testid="tile" sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2, minHeight: 100 }}>
        <Typography variant="body2">{n}</Typography>
      </Box>
    )),
  },
} satisfies Meta<typeof TileGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Twelve: Story = {
  play: async ({ canvasElement }) => {
    const tiles = await within(canvasElement).findAllByTestId('tile')
    await expect(tiles).toHaveLength(12)
    // Every tile has to be able to shrink. `minmax(0, 1fr)` rather than `1fr`
    // is what stops a long word inside one from widening the whole column.
    for (const tile of tiles) {
      await expect(tile.getBoundingClientRect().right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1)
    }
  },
}

export const Three: Story = { args: { columns: 3 } }
