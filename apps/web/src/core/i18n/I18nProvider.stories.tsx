import { Trans } from '@lingui/react/macro'
import { Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { I18nProvider } from './I18nProvider'
import type { Messages } from './activateCatalog'
import { useLocale } from './localeContext'
import type { Locale } from './locales'

/**
 * What the provider does when a catalog will not load.
 *
 * A reader on a hotel connection, or behind a proxy that mangles a chunk, hits
 * this on their first page. The failure that matters is the silent one: lingui
 * renders nothing at all until some catalog is active, so a cold start that
 * fails used to leave a permanently blank page with no error on it.
 */

const Sample = () => {
  const { locale } = useLocale()

  return (
    <Stack spacing={1} sx={{ p: 3 }}>
      <Typography variant="h3">
        <Trans>What do you need to do?</Trans>
      </Typography>
      <Typography variant="body2" data-testid="active-locale">
        {locale}
      </Typography>
    </Stack>
  )
}

/**
 * Module scope, not inline, so its identity is stable across renders and the
 * provider's effect does not re-run on every one.
 */
const alwaysFails = async (): Promise<Messages> => {
  throw new Error('the catalog could not be fetched')
}

const Harness = ({ locale, load }: { locale: Locale; load?: (locale: Locale) => Promise<Messages> }) => (
  <I18nProvider locale={locale} load={load}>
    <Sample />
  </I18nProvider>
)

const meta = {
  title: 'Foundations/I18nProvider',
  component: Harness,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

export const Loaded: Story = {
  args: { locale: 'fa-IR' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByTestId('active-locale')).toHaveTextContent('fa-IR')
  },
}

/**
 * A load that fails while a catalog is already live.
 *
 * `i18n` is a module singleton and the preview decorator activates a catalog
 * before any story mounts, so inside Storybook something is ALWAYS live. This
 * story therefore exercises the "keep what is already live" branch, and the
 * promise it checks is that the provider reports the locale actually on screen
 * rather than the one that just failed. Reporting the failed locale is what
 * would put English text inside a right-to-left layout.
 *
 * It read `toHaveTextContent('en-US')` until the four-combination matrix was
 * built, which passed only because the default toolbar direction is en-US: it
 * was asserting the ambient locale while claiming to assert a fallback. The
 * other branch, where NOTHING is active and an empty English catalog is
 * activated so the page still reads, cannot be reached from a story for the
 * same reason. That is SB-134.
 */
export const CatalogFailed: Story = {
  args: { locale: 'fa-IR', load: alwaysFails },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const live = globals['locale'] === 'fa-IR' ? 'fa-IR' : 'en-US'

    // Not blank: lingui renders nothing at all until some catalog is active,
    // and a cold start that fails used to leave a permanently empty page.
    const heading = await canvas.findByRole('heading')
    await expect(heading).toBeVisible()
    await expect(heading).not.toBeEmptyDOMElement()

    // The locale reported is the one whose catalog is genuinely active, which
    // is the decorator's, never the fa-IR load that just threw.
    await expect(await canvas.findByTestId('active-locale')).toHaveTextContent(live)
  },
}
