import { Client, cacheExchange, fetchExchange } from 'urql'

/**
 * The endpoint, from the environment, because the API is a different origin in
 * every deployment and there is no sensible default that is right twice.
 */
export const endpoint = (): string => import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql'

/**
 * A document cache, not a normalised one.
 *
 * This product is read heavy and nothing in the app edits content: a
 * contribution goes to a moderation queue rather than changing what is on
 * screen. Every context-dependent query carries its context in its variables,
 * so it already gets a distinct cache key, which is what a normalised cache
 * would have been bought for.
 */
export const createClient = (url = endpoint()): Client =>
  new Client({
    url,
    exchanges: [cacheExchange, fetchExchange],
    // POST, explicitly. A GET query is rejected by Apollo Server's CSRF
    // prevention with a 400 unless it carries a preflight-triggering header,
    // and the app then renders its "unknown" state while the API logs nothing
    // wrong. GET would be worth revisiting for CDN caching, with the
    // `apollo-require-preflight` header, when there is a CDN to cache in.
    preferGetMethod: false,
  })
