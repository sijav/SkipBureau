import { useLayoutEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import type { Client } from 'urql'
import { AppRoutes, LocaleShell } from './core/router'

/**
 * `basename` comes from Vite's `base`, so the same build works at a domain
 * root and under the repository subpath GitHub Pages serves from.
 */
export const AppRoot = ({ client }: { client?: Client | undefined }) => {
  // SB-155: the prerendered snapshot is hidden from a reader who prefers dark
  // while it is on screen. React has replaced it by now, and this runs before
  // the frame is painted, so the page the reader sees is never hidden.
  useLayoutEffect(() => {
    window.document.getElementById('root')?.removeAttribute('data-snapshot')
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LocaleShell client={client}>
        <AppRoutes />
      </LocaleShell>
    </BrowserRouter>
  )
}
