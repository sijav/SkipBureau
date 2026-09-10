import { Route, Routes } from 'react-router-dom'
import { NotFound, Placeholder } from 'src/screens'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

/**
 * Every screen is a placeholder. The routes are the deliverable here; the
 * screens are SB-041 to SB-045 and wait on the responsive foundation.
 */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path=":locale/:country" element={<CountryRoute />}>
      <Route index element={<Placeholder route="home" />} />
      <Route path="t/:goal" element={<Placeholder route="task-hub" />} />
      <Route path="t/:goal/:category" element={<Placeholder route="category-hub" />} />
      <Route path="g/:guide" element={<Placeholder route="guide" />} />
      <Route path="g/:guide/suggest" element={<Placeholder route="suggest" />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)
