import { Stack, useTheme } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { Mark } from 'src/core/theme'
import { RowMark } from './RowMark'

const MARKS: Mark[] = ['check', 'ring', 'dash', 'bang', 'dots', 'bar', 'play']

/** Every mark at both sizes, in the text colour, for looking. */
const Every = () => {
  const { tokens } = useTheme()
  return (
    <Stack spacing={2}>
      {([18, 20] as const).map((size) => (
        <Stack key={size} direction="row" spacing={3} data-testid={`size-${String(size)}`}>
          {MARKS.map((mark) => (
            <RowMark key={mark} mark={mark} size={size} color={tokens.textPrimary} />
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

const meta = {
  title: 'Shared/RowMark',
  component: RowMark,
  args: { mark: 'check', size: 20, color: 'currentColor' },
} satisfies Meta<typeof RowMark>

export default meta
type Story = StoryObj<typeof meta>

/** Drawn to its box, and hidden from assistive technology: the status word says it. */
export const Default: Story = {
  render: () => <Every />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const small = (await canvas.findByTestId('size-18')).querySelector('svg')
    const big = (await canvas.findByTestId('size-20')).querySelector('svg')
    await expect(small?.getAttribute('aria-hidden')).toBe('true')
    await expect(window.getComputedStyle(small ?? canvasElement).width).toBe('18px')
    await expect(window.getComputedStyle(big ?? canvasElement).width).toBe('20px')
  },
}
