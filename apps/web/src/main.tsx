import { i18n } from '@lingui/core'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createClient } from 'src/core/graphql'
import { loadCatalog } from 'src/core/i18n'
import { preloadRoute, readerFromSegment } from 'src/core/router'
import { systemMode } from 'src/core/theme'
import { isPartLoadFailure, preloadEveryPart } from 'src/shared/lazy-part'
import { AppRoot } from './AppRoot'

const root = window.document.getElementById('root')
if (!root) throw new Error('index.html has no #root, so there is nowhere to mount')

// SB-159: a deploy renames every chunk, and a page opened before it asks for
// names that are gone. When a render needs code that cannot be fetched, the
// address is loaded again, which gets the new names: once per address, so a
// chunk that is really missing cannot keep reloading the page. A load that
// fails in the background is not a reason: it is asked for again if needed.
const RELOADED = 'skipbureau:reloaded-for'
const reloadOnce = (): boolean => {
  try {
    if (window.sessionStorage.getItem(RELOADED) === window.location.href) return false
    window.sessionStorage.setItem(RELOADED, window.location.href)
  } catch {
    return false
  }
  window.location.reload()
  return true
}
const onUncaughtError = (error: unknown) => {
  if (isPartLoadFailure(error) && reloadOnce()) return
  // What React does with an uncaught error when not told otherwise.
  window.reportError(error)
}

// SB-159: the screen at this address, asked for now and awaited before the
// first render, so that render has it: hydration then matches the file as it
// did when there was one script, and a page rendered fresh never shows an
// empty screen while its code loads. A prerendered file has already asked for
// it, alongside the app's own script.
const screen = preloadRoute(window.location.pathname, import.meta.env.BASE_URL).then(
  () => true,
  () => false,
)

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

const mount = () => {
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
    hydrateRoot(root, app, { onUncaughtError })
  } else createRoot(root, { onUncaughtError }).render(app)

  // Everything else the app may need, once the page has what it needs and the
  // browser is idle: a tap on the language, the details or the next page then
  // finds its code already here. Safari has no requestIdleCallback, so there
  // it is the next task.
  const later = () => void preloadEveryPart()
  const whenIdle = () => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(later) : window.setTimeout(later, 0))
  if (window.document.readyState === 'complete') whenIdle()
  else window.addEventListener('load', whenIdle, { once: true })
}

// SB-159: a prerendered page whose screen's code could not be fetched, on a
// bad connection most likely, stays the file: readable, its links plain links.
// A render now could not finish, and its failure would take the page away. In
// dark too, where the light file beats an empty canvas, so the rule hiding it
// goes. A page with no file has nothing to lose, and its render asks again.
const ready = await screen
if (seed && !ready) {
  for (const node of window.document.head.querySelectorAll('style[data-prerendered]')) node.remove()
  root.removeAttribute('data-snapshot')
} else mount()
