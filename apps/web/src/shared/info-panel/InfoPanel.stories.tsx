import { Trans } from '@lingui/react/macro'
import { Box, Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { PANEL_KINDS, PANEL_PAINT, dark, light, type ColourTokens, type PanelKind } from 'src/core/theme'
import { expect, within } from 'storybook/test'
import { InfoPanel } from './InfoPanel'

/** The design's own sample copy, per kind. */
const BODY: Record<PanelKind, ReactElement> = {
  officialInformation: (
    <Trans>
      A student residence permit application must be submitted within one month of arrival, and the appointment is booked
      through the official e-ikamet system.
    </Trans>
  ),
  practicalAdvice: (
    <Trans>
      Appointment slots in Istanbul are usually released early in the morning and taken within the hour. Applicants report
      better luck checking daily than waiting for a convenient date.
    </Trans>
  ),
  warning: (
    <Trans>
      Your passport must stay valid for at least 60 days beyond the end of the permit you are requesting. Applications are
      refused on this alone more often than on any other single reason.
    </Trans>
  ),
  scamWarning: (
    <Trans>
      No agent can get an appointment faster than the official system, and nobody can guarantee approval. Paying for a
      “guaranteed” slot buys you nothing you cannot do yourself for free.
    </Trans>
  ),
  legalUncertainty: (
    <Trans>
      Whether your diploma needs an apostille or consular legalization depends on your country of issue. We cannot show one
      answer here until you tell us your nationality.
    </Trans>
  ),
  coverageGap: (
    <Trans>
      We have not verified this process for Antalya. The steps below are correct for Istanbul, Ankara and Izmir; local
      document requirements may differ.
    </Trans>
  ),
}

const META: Record<PanelKind, ReactElement> = {
  officialInformation: <Trans>Presidency of Migration Management · verified August 2026</Trans>,
  practicalAdvice: <Trans>From applicant reports, not an official rule</Trans>,
  warning: <Trans>Check before booking your appointment</Trans>,
  scamWarning: <Trans>You do not need an agent for this step</Trans>,
  legalUncertainty: <Trans>Set your nationality to resolve this</Trans>,
  coverageGap: <Trans>Tell us if you have done this in Antalya</Trans>,
}

const asHex = (computed: string): string => {
  const [red = 0, green = 0, blue = 0] = (computed.match(/[\d.]+/g) ?? []).map(Number)
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const tokensFor = (mode: unknown): ColourTokens => {
  const isDark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? dark : light
}

// A harness taking only `kind`, the pattern I18nProvider's story uses.
// Storybook's inference collapses a discriminated-union props type to never,
// and the union is the point: it is what stops Official and Practical from
// omitting their source. The body and source line follow the kind.
const Harness = ({ kind }: { kind: PanelKind }) => (
  <InfoPanel kind={kind} meta={META[kind]}>
    {BODY[kind]}
  </InfoPanel>
)

const meta = {
  title: 'Shared/InfoPanel',
  component: Harness,
  args: { kind: 'officialInformation' },
  argTypes: { kind: { control: 'select', options: PANEL_KINDS } },
  // The design's sample is 560 wide; in a guide the panel fills its column.
  decorators: [(Story) => <Box sx={{ maxWidth: 560 }}>{Story()}</Box>],
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** All six, each checked against its tokens, its stroke and its reading side. */
export const Kinds: Story = {
  render: () => (
    <Stack spacing={4}>
      {PANEL_KINDS.map((kind) => (
        <InfoPanel key={kind} kind={kind} meta={META[kind]} data-testid={kind}>
          {BODY[kind]}
        </InfoPanel>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const tokens = tokensFor(globals['mode'])
    const rtl = globals['direction'] === 'fa-IR'

    for (const kind of PANEL_KINDS) {
      const want = PANEL_PAINT[kind]
      const panel = await canvas.findByTestId(kind)
      const style = window.getComputedStyle(panel)

      await expect(asHex(style.backgroundColor)).toBe(tokens[want.fill].toLowerCase())
      await expect(asHex(style.borderTopColor)).toBe(tokens[want.stroke].toLowerCase())
      await expect(style.borderTopStyle).toBe(want.dashed ? 'dashed' : 'solid')

      // The 3px bar sits on the side reading starts from.
      await expect(rtl ? style.borderRightWidth : style.borderLeftWidth).toBe('3px')
      await expect(rtl ? style.borderLeftWidth : style.borderRightWidth).toBe('1px')

      // A note, named by its eyebrow, never an alert: a guide page with five
      // panels must not announce five things the moment it loads.
      await expect(panel).toHaveAttribute('role', 'note')
      const [eyebrow, body, source] = Array.from(panel.children)
      await expect(panel).toHaveAccessibleName(eyebrow?.textContent ?? '')

      if (eyebrow) {
        const eyebrowStyle = window.getComputedStyle(eyebrow)
        await expect(asHex(eyebrowStyle.color)).toBe(tokens[want.eyebrow].toLowerCase())
        await expect(eyebrowStyle.textTransform).toBe('uppercase')
        // Persian: no tracking, which would pull a cursive script's joins apart,
        // and the UI face, because a mono stack has no Persian letters and fell
        // through to a monospaced Arabic face. English keeps the design's 8%.
        await expect(eyebrowStyle.letterSpacing).toBe(rtl ? 'normal' : '0.88px')
        await expect(eyebrowStyle.fontFamily).toMatch(rtl ? /^"?Archivo/ : /^"?IBM Plex Mono/)
      }
      if (body) await expect(asHex(window.getComputedStyle(body).color)).toBe(tokens[want.body].toLowerCase())
      if (source) {
        const sourceStyle = window.getComputedStyle(source)
        await expect(asHex(sourceStyle.color)).toBe(tokens[want.meta].toLowerCase())
        await expect(sourceStyle.fontFamily).toMatch(rtl ? /^"?Archivo/ : /^"?IBM Plex Mono/)
      }
    }
  },
}

/** Only the four kinds that do not have to say where they came from. */
export const WithoutMeta: Story = {
  render: () => <InfoPanel kind="warning">{BODY.warning}</InfoPanel>,
  play: async ({ canvasElement }) => {
    const panel = await within(canvasElement).findByRole('note')
    await expect(panel.children).toHaveLength(2)
  },
}
