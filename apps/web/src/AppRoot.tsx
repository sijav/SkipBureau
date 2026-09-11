import { BrowserRouter } from 'react-router-dom'
import type { Client } from 'urql'
import { AppRoutes, LocaleShell } from './core/router'

/**
 * `basename` comes from Vite's `base`, so the same build works at a domain
 * root and under the repository subpath GitHub Pages serves from.
 */
export const AppRoot = ({ client }: { client?: Client | undefined }) => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <LocaleShell client={client}>
      <AppRoutes />
    </LocaleShell>
  </BrowserRouter>
)
