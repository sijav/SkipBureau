import { Route, Routes } from 'react-router-dom'
import { CategoryHub, Guide, Home, NotFound, Placeholder, TaskHub } from 'src/screens'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

/** Home, the two hubs and the guide are built, SB-041 to SB-044; suggesting an update is a placeholder until SB-045. */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path=":locale/:country" element={<CountryRoute />}>
      <Route index element={<Home />} />
      <Route path="t/:goal" element={<TaskHub />} />
      <Route path="t/:goal/:category" element={<CategoryHub />} />
      <Route path="g/:guide" element={<Guide />} />
      <Route path="g/:guide/suggest" element={<Placeholder route="suggest" />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)
