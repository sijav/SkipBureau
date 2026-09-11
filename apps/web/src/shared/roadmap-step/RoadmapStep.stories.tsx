import { Trans } from '@lingui/react/macro'
import { Box, Button, Stack, Typography, useTheme } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { dark, light, type ColourTokens } from 'src/core/theme'
import { ChecklistItem } from 'src/shared/checklist-item'
import { InfoPanel } from 'src/shared/info-panel'
import { SourceCard } from 'src/shared/source-card'
import { expect, userEvent, within } from 'storybook/test'
import { RoadmapStep } from './RoadmapStep'

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

/** A computed colour as the token's hex, so the check names no colour of its own. */
const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

/** One fact of the step, a mono label in a 130 column as drawn. */
const Fact = ({ label, children }: { label: ReactNode; children: ReactNode }) => {
  const { tokens } = useTheme()
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <Typography component="dt" variant="monoData" sx={{ width: '130px', flexShrink: 0, color: tokens.textSecondary }}>
        {label}
      </Typography>
      <Typography component="dd" variant="monoData" sx={{ flex: '1 0 0', minWidth: 0, margin: 0, color: tokens.textPrimary }}>
        {children}
      </Typography>
    </Box>
  )
}

/** Figma 32:74's body, composed from the components that already exist. */
const Body = () => {
  const { tokens } = useTheme()
  return (
    <>
      <Stack spacing="6px">
        <Typography component="h4" variant="overline">
          <Trans>What to do</Trans>
        </Typography>
        <Typography variant="body2">
          <Trans>
            Take your passport and diploma to a sworn translator, then to any notary to have the translations certified. The notary does not
            need an appointment; most offices handle this the same day.
          </Trans>
        </Typography>
      </Stack>
      <Box component="dl" sx={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
        <Fact label={<Trans>Where</Trans>}>
          <Trans>Any notary (noter) in Izmir</Trans>
        </Fact>
        <Fact label={<Trans>Format</Trans>}>
          <Trans>In person, it cannot be done online</Trans>
        </Fact>
        <Fact label={<Trans>Estimated cost</Trans>}>
          <Trans>₺1,200 to ₺1,600 for two documents</Trans>
        </Fact>
        <Fact label={<Trans>Estimated time</Trans>}>
          <Trans>Same day, about 1 hour</Trans>
        </Fact>
      </Box>
      <Box>
        <Typography component="h4" variant="overline" sx={{ display: 'block' }}>
          <Trans>Documents needed</Trans>
        </Typography>
        <ChecklistItem
          state="required"
          title={<Trans>Passport translation</Trans>}
          flags={<Trans>Sworn translation · Notarised · 2 copies</Trans>}
        />
        <ChecklistItem state="completed" title={<Trans>Passport translation</Trans>} flags={<Trans>Ready since 14 Aug 2026</Trans>} />
      </Box>
      <InfoPanel kind="warning" meta={<Trans>Check before booking your appointment</Trans>}>
        <Trans>
          Your passport must stay valid for at least 60 days beyond the end of the permit you are requesting. Applications are refused on
          this alone more often than on any other single reason.
        </Trans>
      </InfoPanel>
      <SourceCard
        state="verified"
        publisher={<Trans>Republic of Türkiye</Trans>}
        institution={<Trans>Presidency of Migration Management</Trans>}
        url="https://www.goc.gov.tr"
        checkedAt="2026-08-24"
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="primary">
          <Trans>Start this process</Trans>
        </Button>
        <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
          <Trans>Next: register the company at the trade registry</Trans>
        </Typography>
      </Box>
    </>
  )
}

const meta = {
  title: 'Shared/RoadmapStep',
  component: RoadmapStep,
  args: {
    number: 3,
    status: 'current',
    title: <Trans>Prepare translated and notarised documents</Trans>,
    meta: <Trans>About 2 days · ₺1,400 · notary</Trans>,
    children: <Body />,
  },
  argTypes: { status: { control: 'select', options: ['completed', 'current', 'upcoming', 'waiting', 'blocked', 'needsInput'] } },
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
} satisfies Meta<typeof RoadmapStep>

export default meta
type Story = StoryObj<typeof meta>

/** Closed it is 73 high; its heading is the button that opens what is under it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = await canvas.findByRole('button', { name: /Prepare translated and notarised documents/ })
    await expect(within(canvas.getByRole('heading', { level: 3 })).getByRole('button')).toBe(toggle)
    const step = canvasElement.querySelector('[data-status="current"]')
    await expect(window.getComputedStyle(step ?? canvasElement).height).toBe('73px')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(await canvas.findByText(/What to do/)).toBeVisible()
  },
}

/** The six statuses, closed. Upcoming has no meta line and is 56. */
export const States: Story = {
  render: () => (
    <Stack spacing={3}>
      <RoadmapStep
        number={3}
        status="completed"
        title={<Trans>Prepare translated and notarised documents</Trans>}
        meta={<Trans>Completed 14 Aug 2026</Trans>}
      >
        <Body />
      </RoadmapStep>
      <RoadmapStep
        number={3}
        status="current"
        title={<Trans>Prepare translated and notarised documents</Trans>}
        meta={<Trans>About 2 days · ₺1,400 · notary</Trans>}
      >
        <Body />
      </RoadmapStep>
      <RoadmapStep number={3} status="upcoming" title={<Trans>Prepare translated and notarised documents</Trans>}>
        <Body />
      </RoadmapStep>
      <RoadmapStep
        number={3}
        status="waiting"
        title={<Trans>Prepare translated and notarised documents</Trans>}
        meta={<Trans>Submitted 3 Sep · usually 15 to 20 days</Trans>}
      >
        <Body />
      </RoadmapStep>
      <RoadmapStep
        number={3}
        status="blocked"
        title={<Trans>Prepare translated and notarised documents</Trans>}
        meta={<Trans>Needs step 02 first</Trans>}
      >
        <Body />
      </RoadmapStep>
      <RoadmapStep
        number={3}
        status="needsInput"
        title={<Trans>Prepare translated and notarised documents</Trans>}
        meta={<Trans>1 question about your company type</Trans>}
      >
        <Body />
      </RoadmapStep>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const word of ['Completed', 'Next action', 'Upcoming', 'Waiting on institution', 'Blocked', 'Needs your answer']) {
      await expect(await canvas.findByText(word)).toBeVisible()
    }
    for (const step of canvasElement.querySelectorAll('[data-status]')) {
      const height = step.getAttribute('data-status') === 'upcoming' ? '56px' : '73px'
      await expect(window.getComputedStyle(step).height).toBe(height)
    }
  },
}

/** Figma 32:74: the current step open, what to do, the facts, the documents, the warning, the source and the action. */
export const Expanded: Story = {
  args: { defaultExpanded: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/Documents needed/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Start this process/ })).toBeVisible()
  },
}

/** The family's focus: the resting surface and a 2px accent-text outline. */
export const Focus: Story = {
  play: async ({ canvasElement, globals }) => {
    const toggle = await within(canvasElement).findByRole('button')
    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    const style = window.getComputedStyle(toggle)
    await expect(style.outlineWidth).toBe('2px')
    await expect(asHex(style.outlineColor)).toBe(tokensFor(globals['mode']).accentText.toLowerCase())
  },
}

// For LOOKING at: synthetic events never apply :hover.
export const Hover: Story = { tags: ['!test'], parameters: { pseudo: { hover: true } } }
