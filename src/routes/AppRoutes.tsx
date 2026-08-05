import { Route, Routes } from 'react-router-dom'
import { MerchantDetailPage } from '../features/merchant-detail/MerchantDetailPage'
import { MerchantsListPage } from '../features/merchants-list/MerchantsListPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { ProfilePage } from '../features/profile/ProfilePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MerchantsListPage />} />
      <Route path="/merchants/:id" element={<MerchantDetailPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  )
}
