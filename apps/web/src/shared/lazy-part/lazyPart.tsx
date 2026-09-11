import { use, type ComponentType, type ReactNode } from 'react'

/** A component whose code arrives when it is first needed, or when asked for sooner. */
export type LazyPart<Props> = ((props: Props) => ReactNode) & { preload: () => Promise<unknown> }

const every = new Set<() => Promise<unknown>>()

/**
 * SB-159: `React.lazy`, except that once the code is in it renders at once.
 * React.lazy suspends on its first render even when the module has loaded,
 * which under `createRoot` is a frame of fallback for a page that was ready.
 * A failed load is forgotten, so the next render asks again.
 */
export const lazyPart = <Props extends object>(load: () => Promise<ComponentType<Props>>): LazyPart<Props> => {
  let loaded: ComponentType<Props> | undefined
  let loading: Promise<ComponentType<Props>> | undefined
  const preload = () =>
    (loading ??= load().then(
      (component) => (loaded = component),
      (error: unknown) => {
        loading = undefined
        throw error
      },
    ))
  every.add(preload)

  const Part = (props: Props) => {
    const Component = loaded ?? use(preload())
    return <Component {...props} />
  }
  return Object.assign(Part, { preload })
}

/** Whether a component is a lazy part, which a route's element is when its screen loads on demand. */
export const isLazyPart = (type: unknown): type is LazyPart<never> => typeof type === 'function' && 'preload' in type && typeof type.preload === 'function'

/** The code of every lazy part, fetched now, for when the page has what it needs and is idle. */
export const preloadEveryPart = () => Promise.allSettled([...every].map((preload) => preload()))
