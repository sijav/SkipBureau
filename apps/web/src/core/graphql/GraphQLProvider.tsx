import { useMemo, type ReactNode } from 'react'
import { Provider } from 'urql'
import type { Client } from 'urql'
import { createClient } from './client'

export type GraphQLProviderProps = {
  children: ReactNode
  /**
   * Injected by a story or a test so each gets a fresh client. Sharing one
   * would share its cache, and a story would then pass or fail depending on
   * which ran before it.
   */
  client?: Client
}

/**
 * `useMemo`, not a call in the JSX.
 *
 * This read `client ?? createClient()` inline, which built a NEW client on
 * every render: the cache was thrown away continuously, so it never served
 * anything and every query went to the network regardless of its policy. It
 * looked like it worked, because always fetching is indistinguishable from a
 * working cache until you test the difference. A guard-failability check found
 * it: a test that should have failed under `cache-first` passed, because there
 * was no cache to be stale.
 */
export const GraphQLProvider = ({ children, client }: GraphQLProviderProps) => {
  const fallback = useMemo(() => createClient(), [])

  return <Provider value={client ?? fallback}>{children}</Provider>
}
