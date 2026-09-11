import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { routes } from './routes'

// No fallback: a navigation is a transition, which keeps the page on screen
// until the next one's code is in (SB-159), and the first render has its
// screen already.
export const AppRoutes = () => <Suspense fallback={null}>{useRoutes(routes)}</Suspense>
