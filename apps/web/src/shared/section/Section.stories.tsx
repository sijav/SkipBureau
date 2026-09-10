import { Trans } from '@lingui/react/macro'
import { Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Section } from './Section'

const meta = {
  title: 'Shared/Section',
  component: Section,
  args: {
    title: <Trans>Common questions</Trans>,
    intro: <Trans>Short answers with the conditions that actually change them.</Trans>,
    children: (
      <Typography>
        <Trans>Content</Trans>
      </Typography>
    ),
  },
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

/** A named region: its heading is a level-two heading a screen reader can jump to. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 2, name: /Common questions/ })).toBeVisible()
    const section = canvasElement.querySelector('section')
    await expect(section).toBeTruthy()
    if (section) await expect(window.getComputedStyle(section).paddingTop).toBe('56px')
  },
}

export const WithoutIntro: Story = { args: { intro: undefined } }
