import { isValidElement } from 'react'
import { createRoutesFromElements, matchRoutes, Route } from 'react-router-dom'
import { NotFound } from 'src/screens/NotFound'
import { isLazyPart, lazyPart } from 'src/shared/lazy-part'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

// SB-159: each screen's code is fetched when its page is, from the screen's
// own folder. Never through `src/screens`, which re-exports every screen: one
// static import of that puts them all back in the first script.
const Home = lazyPart(() => import('src/screens/home').then((screen) => screen.Home))
const TaskHub = lazyPart(() => import('src/screens/task-hub').then((screen) => screen.TaskHub))
const CategoryHub = lazyPart(() => import('src/screens/category-hub').then((screen) => screen.CategoryHub))
const SetupSoon = lazyPart(() => import('src/screens/coming-soon').then((screen) => screen.SetupSoon))
const GuidesSoon = lazyPart(() => import('src/screens/coming-soon').then((screen) => screen.GuidesSoon))
const Guide = lazyPart(() => import('src/screens/guide').then((screen) => screen.Guide))
const SuggestUpdate = lazyPart(() => import('src/screens/suggest').then((screen) => screen.SuggestUpdate))
const SearchResults = lazyPart(() => import('src/screens/search').then((screen) => screen.SearchResults))

/**
 * Every screen, under the reader and the country they are going to:
 * `/en-IR/TR/guides/sim-card`. What is not built yet has a Coming soon page of
 * its own rather than a dead link. Data rather than a `<Routes>` tree, so an
 * address can be matched before anything renders.
 */
export const routes = createRoutesFromElements(
  <>
    <Route path="/" element={<RootRedirect />} />
    <Route path=":reader/:country" element={<CountryRoute />}>
      <Route index element={<Home />} />
      <Route path="tasks/:goal" element={<TaskHub />} />
      <Route path="tasks/:goal/:category" element={<CategoryHub />} />
      <Route path="setup/:goal" element={<SetupSoon />} />
      <Route path="guides" element={<GuidesSoon />} />
      <Route path="guides/:guide" element={<Guide />} />
      <Route path="guides/:guide/suggest" element={<SuggestUpdate />} />
      <Route path="search" element={<SearchResults />} />
      {/* The guard answers first: an old /t/ or /g/ link is moved, the rest is Not Found. */}
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </>,
)

/** The code of the screen at an address, fetched before it renders, so its first render has it. */
export const preloadRoute = (pathname: string, basename?: string) =>
  Promise.all(
    (matchRoutes(routes, pathname, basename) ?? []).map(({ route }) =>
      isValidElement(route.element) && isLazyPart(route.element.type) ? route.element.type.preload() : null,
    ),
  )
