import { Route, Routes } from 'react-router-dom'
import { Home, NotFound, Placeholder } from 'src/screens'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

/** Home is built, SB-041; the rest are placeholders until SB-042 to SB-045 land. */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path=":locale/:country" element={<CountryRoute />}>
      <Route index element={<Home />} />
      <Route path="t/:goal" element={<Placeholder route="task-hub" />} />
      <Route path="t/:goal/:category" element={<Placeholder route="category-hub" />} />
      <Route path="g/:guide" element={<Placeholder route="guide" />} />
      <Route path="g/:guide/suggest" element={<Placeholder route="suggest" />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)
