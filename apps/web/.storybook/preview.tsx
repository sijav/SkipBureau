import CssBaseline from '@mui/material/CssBaseline'
import type { Preview } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { AppTheme } from 'src/core/theme'

/**
 * Every story renders inside the real app theme, so a story cannot look right
 * while the app looks wrong.
 *
 * The mode and direction toolbars exist because the design has to hold in four
 * combinations, and a component is only finished when it has been seen in all
 * of them: en-US and fa-IR, light and dark.
 */
const preview: Preview = {
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
      description: 'Reading direction',
      defaultValue: 'ltr',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'en-US, left to right' },
          { value: 'rtl', title: 'fa-IR, right to left' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context): ReactElement => {
      const mode = context.globals.mode === 'dark' ? 'dark' : 'light'
      const direction = context.globals.direction === 'rtl' ? 'rtl' : 'ltr'

      return (
        <AppTheme mode={mode} direction={direction}>
          <CssBaseline />
          <Story />
        </AppTheme>
      )
    },
  ],
}

export default preview
