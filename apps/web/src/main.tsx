import { i18n } from '@lingui/core'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createClient } from 'src/core/graphql'
import { loadCatalog } from 'src/core/i18n'
import { readerFromSegment } from 'src/core/router'
import { systemMode } from 'src/core/theme'
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

const app = (
  <StrictMode>
    <AppRoot client={seed ? createClient(undefined, { seed }) : undefined} />
  </StrictMode>
)

// SB-160: in light, React adopts the file's elements rather than drawing new
// ones, so the page's largest paint stays the file's. In dark the file is the
// light snapshot, hidden, and hydrating it under the dark palette would
// mismatch on every styled element, so it is replaced.
if (seed && systemMode() === 'light') {
  // Hydrating, React adopts the file's own <title>, <meta> and <link> where
  // they match what PageHead renders, so they are no longer leftovers for
  // PageHead to clear. The file's JSON-LD and snapshot style keep the mark:
  // React renders no copy of those in the head, and they still go.
  for (const node of window.document.head.querySelectorAll('title[data-prerendered], meta[data-prerendered], link[data-prerendered]')) {
    node.removeAttribute('data-prerendered')
  }
  hydrateRoot(root, app)
} else createRoot(root).render(app)
