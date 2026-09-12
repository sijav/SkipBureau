import { Suspense, useMemo, type ReactNode } from 'react'
import { Provider } from 'urql'
import type { Client } from 'urql'
import { createClient } from './client'

export type GraphQLProviderProps = {
  children: ReactNode
  client?: Client | undefined
}

export const GraphQLProvider = ({ children, client }: GraphQLProviderProps) => {
  // `useMemo`, not a call in the JSX.
  //
  // This read `client ?? createClient()` inline, which built a NEW client on
  // every render: the cache was thrown away continuously, so it never served
  // anything and every query went to the network regardless of its policy. It
  // looked like it worked, because always fetching is indistinguishable from a
  // working cache until you test the difference. A guard-failability check found
  // it: a test that should have failed under `cache-first` passed, because there
  // was no cache to be stale.
  const fallback = useMemo(() => createClient(), [])

  // A boundary here, inside the provider, because queries suspend (SB-046)
  // and whatever suspends must have the client ABOVE it: React discards a
  // suspended subtree's state and builds it again when it retries, so a
  // boundary outside this provider rebuilds the client, which asks again,
  // which suspends again, for ever. The routes have their own boundary
  // nested under this one, which is what keeps the page a reader is on; this
  // is the one that catches anything else, a story rendering a screen on its
  // own above all.
  return (
    <Provider value={client ?? fallback}>
      <Suspense fallback={null}>{children}</Suspense>
    </Provider>
  )
}
