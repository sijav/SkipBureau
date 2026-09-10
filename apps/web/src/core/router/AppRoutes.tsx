import { Route, Routes } from 'react-router-dom'
import { CategoryHub, Home, NotFound, Placeholder, TaskHub } from 'src/screens'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

/** Home and the two hubs are built, SB-041 to SB-043; the guide and suggest screens are placeholders until SB-044 and SB-045. */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path=":locale/:country" element={<CountryRoute />}>
      <Route index element={<Home />} />
      <Route path="t/:goal" element={<TaskHub />} />
      <Route path="t/:goal/:category" element={<CategoryHub />} />
      <Route path="g/:guide" element={<Placeholder route="guide" />} />
      <Route path="g/:guide/suggest" element={<Placeholder route="suggest" />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)
