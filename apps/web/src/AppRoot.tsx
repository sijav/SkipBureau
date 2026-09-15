import { BrowserRouter } from 'react-router-dom'
import type { Client } from 'urql'
import { AppRoutes, LocaleShell } from './core/router'

/**
 * `basename` comes from Vite's `base`, so the same build works at a domain
 * root and under the repository subpath GitHub Pages serves from. `hydrating`
 * says the page is adopting its prerendered file, which decides when its
 * address's status is first read (SB-256).
 */
export const AppRoot = ({ client, hydrating = false }: { client?: Client | undefined; hydrating?: boolean | undefined }) => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <LocaleShell client={client} hydrating={hydrating}>
      <AppRoutes />
    </LocaleShell>
  </BrowserRouter>
)
