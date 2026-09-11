import { i18n } from '@lingui/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from 'src/core/graphql'
import { loadCatalog } from 'src/core/i18n'
import { readerFromSegment } from 'src/core/router'
import { AppRoot } from './AppRoot'

const root = window.document.getElementById('root')
if (!root) throw new Error('index.html has no #root, so there is nowhere to mount')

// SB-155: a prerendered page carries the results it was rendered from. With
// those, and its catalog loaded before the first render, that render asks for
// nothing and draws what the file already shows, instead of an empty moment.
const seed = window.__SKIPBUREAU_DATA__
if (seed) {
  const segment = window.location.pathname.slice(import.meta.env.BASE_URL.length).split('/')[0] ?? ''
  const locale = readerFromSegment(segment)?.locale
  try {
    if (locale) i18n.loadAndActivate({ locale, messages: await loadCatalog(locale) })
  } catch {
    // The provider loads it again, and says so if it cannot.
  }
}

createRoot(root).render(
  <StrictMode>
    <AppRoot client={seed ? createClient(undefined, { seed }) : undefined} />
  </StrictMode>,
)
