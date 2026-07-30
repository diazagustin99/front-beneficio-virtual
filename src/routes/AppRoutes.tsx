import { Route, Routes } from 'react-router-dom'
import { PromotionsListPage } from '../features/promotions-list/PromotionsListPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PromotionsListPage />} />
    </Routes>
  )
}
