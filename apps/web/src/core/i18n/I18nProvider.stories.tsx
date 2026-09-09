import { Trans } from '@lingui/react/macro'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
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
 * The cold start that fails. English is activated with no messages, because
 * every message id in this codebase IS its English text, so the page still
 * reads. What must never happen is nothing.
 */
export const CatalogFailed: Story = {
  args: { locale: 'fa-IR', load: alwaysFails },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The page renders rather than staying blank.
    await expect(await canvas.findByText('What do you need to do?')).toBeVisible()

    // And it does not claim to be showing Persian, because it is not. The
    // reported locale is the one that actually activated.
    await expect(await canvas.findByTestId('active-locale')).toHaveTextContent('en-US')
  },
}
