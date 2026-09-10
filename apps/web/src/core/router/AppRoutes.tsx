import { Route, Routes } from 'react-router-dom'
import { CategoryHub, Guide, GuidesSoon, Home, NotFound, SearchResults, SetupSoon, SuggestUpdate, TaskHub } from 'src/screens'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

/**
 * Every screen, under the reader and the country they are going to:
 * `/en-IR/TR/guides/sim-card`. What is not built yet has a Coming soon page of
 * its own rather than a dead link.
 */
export const AppRoutes = () => (
  <Routes>
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
  </Routes>
)
