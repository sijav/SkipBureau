import { i18n } from '@lingui/core'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router-dom'
import { ssrExchange, type SSRData } from 'urql'
import { createClient } from 'src/core/graphql'
import { loadCatalog, type Locale } from 'src/core/i18n'
import { AppRoutes, LocaleShell } from 'src/core/router'
import { SiteProvider } from 'src/core/site'

export type RenderedPage = {
  /** The page's markup, what goes inside `#root`. */
  html: string
  /** The GraphQL results it was rendered from, which the client starts from. */
  data: SSRData
}

/**
 * SB-155: one address rendered the way the browser renders it, with the app's
 * own shell and routes, and every query answered before a byte is written:
 * the client is in suspense mode and React's prerender waits for it. The head
 * is the prerender's to write, so PageHead and StructuredData stand aside here.
 */
export const renderPage = async ({ address, locale, origin, endpoint }: { address: string; locale: Locale; origin: string; endpoint?: string }): Promise<RenderedPage> => {
  // The app reads lingui's shared instance; one page at a time, so it is this page's.
  i18n.loadAndActivate({ locale, messages: await loadCatalog(locale) })
  const ssr = ssrExchange({ isClient: false })
  const client = createClient(endpoint, { server: ssr })
  const basename = import.meta.env.BASE_URL

  const { prelude } = await prerender(
    <StaticRouter basename={basename} location={`${basename.replace(/\/$/, '')}${address}`}>
      <SiteProvider origin={origin}>
        <LocaleShell client={client}>
          <AppRoutes />
        </LocaleShell>
      </SiteProvider>
    </StaticRouter>,
  )

  return { html: await new Response(prelude).text(), data: ssr.extractData() }
}
