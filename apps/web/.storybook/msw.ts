import { isCommonAssetRequest } from 'msw'
import type { SetupWorker } from 'msw/browser'
import type { RequestHandler } from 'msw'

/**
 * MSW for every story, started once and reset between them.
 *
 * Not `msw-storybook-addon`: its version 3 dropped `initialize` and `mswLoader`
 * for an API that hands you a worker and leaves applying handlers to you, which
 * is what this does in about the same number of lines and without a second
 * package to keep in step with Storybook.
 *
 * Faking at the network rather than swapping urql's exchange is deliberate. An
 * exchange never sends a request, so the endpoint, the request body and urql's
 * own fetch path would all be untested and every story would pass while the
 * browser failed.
 */

let worker: SetupWorker | undefined

/** Storybook's own machinery, which is not the application making requests. */
const isStorybookRequest = (url: string): boolean =>
  /\.eot$|\.mdx$|sb-common-assets|__webpack_hmr|iframe\.html|sb-vite|@vite|@react-refresh|\/virtual:|\.stories\./.test(url)

export const startWorker = async (): Promise<SetupWorker> => {
  if (worker) return worker

  const { setupWorker } = await import('msw/browser')
  worker = setupWorker()

  await worker.start({
    quiet: true,
    // MSW defaults this to `/mockServiceWorker.js`, which is relative to the
    // DOMAIN root and not to Vite's base. Deployed under /SkipBureau/storybook/
    // it would ask sijav.github.io for a file that is not there, every story
    // would fail to register a worker, and the page would still return 200.
    // BASE_URL is whatever `base` was built with, so this follows it.
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    // An unhandled request is an error, not a pass-through. A story that
    // quietly reached the real API would pass on the machine that had one
    // running and fail everywhere else.
    onUnhandledRequest: (request, print) => {
      if (isCommonAssetRequest(request) || isStorybookRequest(request.url)) return
      print.error()
    },
  })

  return worker
}

export const applyHandlers = async (handlers: readonly RequestHandler[] | undefined): Promise<void> => {
  const active = await startWorker()
  active.resetHandlers()
  if (handlers?.length) active.use(...handlers)
}
