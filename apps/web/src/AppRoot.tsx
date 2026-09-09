import { BrowserRouter } from 'react-router-dom'
import { AppRoutes, LocaleShell } from './core/router'

/**
 * `basename` comes from Vite's `base`, so the same build works at a domain
 * root and under the repository subpath GitHub Pages serves from.
 */
export const AppRoot = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <LocaleShell>
      <AppRoutes />
    </LocaleShell>
  </BrowserRouter>
)
