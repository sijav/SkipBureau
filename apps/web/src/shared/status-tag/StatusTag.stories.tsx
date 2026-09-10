import { Trans } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { TAG_PAINT, TAG_STATUSES, dark, light, type ColourTokens, type TagStatus } from 'src/core/theme'
import { expect, within } from 'storybook/test'
import { StatusTag } from './StatusTag'

/** The design's own sample label for each status. */
const SAMPLE: Record<TagStatus, ReactNode> = {
  official: <Trans>Official</Trans>,
  verified: <Trans>Verified Aug 2026</Trans>,
  needsContext: <Trans>Depends on nationality</Trans>,
  deadline: <Trans>Due in 12 days</Trans>,
  warning: <Trans>Check before you pay</Trans>,
  blocked: <Trans>Blocked</Trans>,
  waiting: <Trans>Waiting on institution</Trans>,
  completed: <Trans>Completed</Trans>,
}

/** A computed colour as hex, so the story never spells a colour itself. */
const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

const meta = {
  title: 'Shared/StatusTag',
  component: StatusTag,
  // No label by default: the render gives each status its own sample, so the
  // Controls panel's status picker changes the words as well as the colours.
  args: { status: 'official', showMark: true, children: undefined },
  argTypes: { status: { control: 'select', options: TAG_STATUSES }, children: { control: false } },
  // The label follows the chosen status unless a story passes its own.
  render: (args) => <StatusTag {...args}>{args.children ?? SAMPLE[args.status]}</StatusTag>,
} satisfies Meta<typeof StatusTag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** All eight, as the design lays them out, each checked against its tokens. */
export const Statuses: Story = {
  render: (args) => (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {TAG_STATUSES.map((status) => (
        <StatusTag key={status} {...args} status={status} data-testid={status}>
          {SAMPLE[status]}
        </StatusTag>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])

    for (const status of TAG_STATUSES) {
      const want = TAG_PAINT[status]
      const tag = await canvas.findByTestId(status)
      const style = window.getComputedStyle(tag)

      await expect(asHex(style.backgroundColor)).toBe(tokens[want.fill].toLowerCase())
      await expect(asHex(style.borderTopColor)).toBe(tokens[want.stroke].toLowerCase())
      await expect(asHex(style.color)).toBe(tokens[want.label].toLowerCase())
      // 24px, with the stroke inside as Figma draws it.
      await expect(style.height).toBe('24px')
      // Label Small is sentence case. MUI's overline default is capitals.
      await expect(style.textTransform).toBe('none')

      const mark = tag.querySelector('[aria-hidden="true"]')
      await expect(mark).not.toBeNull()
      if (mark) await expect(asHex(window.getComputedStyle(mark).backgroundColor)).toBe(tokens[want.mark].toLowerCase())
    }
  },
}

/** The mark is optional in the design. Without it the label still says it all. */
export const WithoutMark: Story = {
  args: { showMark: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-hidden="true"]')).toBeNull()
  },
}
