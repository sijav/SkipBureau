import { Route, Routes } from 'react-router-dom'
import { Home, NotFound, Placeholder, TaskHub } from 'src/screens'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

/** Home and the task hub are built, SB-041 and SB-042; the rest are placeholders until SB-043 to SB-045 land. */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path=":locale/:country" element={<CountryRoute />}>
      <Route index element={<Home />} />
      <Route path="t/:goal" element={<TaskHub />} />
      <Route path="t/:goal/:category" element={<Placeholder route="category-hub" />} />
      <Route path="g/:guide" element={<Placeholder route="guide" />} />
      <Route path="g/:guide/suggest" element={<Placeholder route="suggest" />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)
