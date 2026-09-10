import CssBaseline from '@mui/material/CssBaseline'
import type { Preview } from '@storybook/react-vite'
import type { RequestHandler } from 'msw'
import { applyHandlers } from './msw'
import type { ReactElement } from 'react'
import { I18nProvider } from 'src/core/i18n'
import { AppTheme } from 'src/core/theme'

/**
 * Every story renders inside the real app theme, so a story cannot look right
 * while the app looks wrong.
 *
 * The mode and direction toolbars let a person switch between the four
 * combinations the design has to hold in: en-US and fa-IR, light and dark.
 *
 * They are a review aid, not a test matrix. Vitest runs each story once, with
 * the default globals below, so nothing here automatically checks the other
 * three. Seeing all four is a rule someone follows, not one the suite enforces,
 * and the first version of this comment implied otherwise.
 */
const preview: Preview = {
  // Handlers come from the story, through parameters.msw.handlers, and are
  // reset between stories so one cannot leak into the next.
  beforeEach: async ({ parameters }) => {
    const msw = parameters['msw'] as { handlers?: readonly RequestHandler[] } | undefined
    await applyHandlers(msw?.handlers)
  },

  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
  },
  globalTypes: {
    mode: {
      description: 'Light or dark',
      defaultValue: 'light',
      toolbar: {
        title: 'Mode',
        icon: 'sun',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Language and reading direction',
      defaultValue: 'en-US',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'en-US', title: 'en-US, left to right' },
          { value: 'fa-IR', title: 'fa-IR, right to left' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context): ReactElement => {
      const mode = context.globals.mode === 'dark' ? 'dark' : 'light'
      const locale = context.globals.direction === 'fa-IR' ? 'fa-IR' : 'en-US'

      return (
        <I18nProvider locale={locale}>
          <AppTheme mode={mode} direction={locale === 'fa-IR' ? 'rtl' : 'ltr'}>
            <CssBaseline />
            <Story />
          </AppTheme>
        </I18nProvider>
      )
    },
  ],
}

export default preview
