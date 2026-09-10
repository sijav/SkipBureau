import type { ReactNode } from 'react'
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

export const GraphQLProvider = ({ children, client }: GraphQLProviderProps) => (
  <Provider value={client ?? createClient()}>{children}</Provider>
)
