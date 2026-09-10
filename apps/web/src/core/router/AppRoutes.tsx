import { Route, Routes } from 'react-router-dom'
import { CategoryHub, Guide, Home, NotFound, SuggestUpdate, TaskHub } from 'src/screens'
import { CountryRoute } from './CountryRoute'
import { RootRedirect } from './RootRedirect'

/** Every screen the design draws: Home, the two hubs, the guide and suggesting an update to it. */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path=":locale/:country" element={<CountryRoute />}>
      <Route index element={<Home />} />
      <Route path="t/:goal" element={<TaskHub />} />
      <Route path="t/:goal/:category" element={<CategoryHub />} />
      <Route path="g/:guide" element={<Guide />} />
      <Route path="g/:guide/suggest" element={<SuggestUpdate />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)
