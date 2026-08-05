import { apiClient, type ApiItemEnvelope, type ApiListEnvelope } from './client'
import type { AppNotification, AppPreference } from './types'

export interface CompleteOnboardingPayload {
  email?: string
  merchant_ids: number[]
  wallet_ids: number[]
  wants_notifications: boolean
}

export async function completeOnboarding(payload: CompleteOnboardingPayload): Promise<AppPreference> {
  const response = await apiClient.request<ApiItemEnvelope<AppPreference>>('/preferences', undefined, {
    method: 'POST',
    body: payload,
  })

  return response.data
}

export async function getPreference(token: string): Promise<AppPreference> {
  const response = await apiClient.request<ApiItemEnvelope<AppPreference>>(`/preferences/${token}`)

  return response.data
}

export async function updateNotificationPreference(token: string, wantsNotifications: boolean): Promise<AppPreference> {
  const response = await apiClient.request<ApiItemEnvelope<AppPreference>>(`/preferences/${token}`, undefined, {
    method: 'PATCH',
    body: { wants_notifications: wantsNotifications },
  })

  return response.data
}

export async function followMerchant(token: string, merchantId: number): Promise<AppPreference> {
  const response = await apiClient.request<ApiItemEnvelope<AppPreference>>(
    `/preferences/${token}/merchants/${merchantId}`,
    undefined,
    { method: 'POST' },
  )

  return response.data
}

export async function unfollowMerchant(token: string, merchantId: number): Promise<AppPreference> {
  const response = await apiClient.request<ApiItemEnvelope<AppPreference>>(
    `/preferences/${token}/merchants/${merchantId}`,
    undefined,
    { method: 'DELETE' },
  )

  return response.data
}

export async function followWallet(token: string, walletId: number): Promise<AppPreference> {
  const response = await apiClient.request<ApiItemEnvelope<AppPreference>>(
    `/preferences/${token}/wallets/${walletId}`,
    undefined,
    { method: 'POST' },
  )

  return response.data
}

export async function unfollowWallet(token: string, walletId: number): Promise<AppPreference> {
  const response = await apiClient.request<ApiItemEnvelope<AppPreference>>(
    `/preferences/${token}/wallets/${walletId}`,
    undefined,
    { method: 'DELETE' },
  )

  return response.data
}

export interface PaginatedNotifications {
  items: AppNotification[]
  currentPage: number
  totalPages: number
}

export async function getPreferenceNotifications(
  token: string,
  page = 1,
  perPage = 15,
): Promise<PaginatedNotifications> {
  const response = await apiClient.request<ApiListEnvelope<AppNotification>>(`/preferences/${token}/notifications`, {
    page,
    per_page: perPage,
  })

  return {
    items: response.data,
    currentPage: response.current_page,
    totalPages: response.total_pages,
  }
}

export async function markNotificationRead(token: string, notificationId: string): Promise<void> {
  await apiClient.request(`/preferences/${token}/notifications/${notificationId}/read`, undefined, {
    method: 'PATCH',
  })
}

// A dedicated count endpoint, not `getPreferenceNotifications(...).items.length`
// — this is polled on an interval for the header badge, and fetching (and
// parsing) full notification payloads just to count them every tick would
// be wasteful.
export async function getUnreadNotificationCount(token: string): Promise<number> {
  const response = await apiClient.request<ApiItemEnvelope<{ unread_count: number }>>(
    `/preferences/${token}/notifications/unread-count`,
  )

  return response.data.unread_count
}

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function savePushSubscription(token: string, subscription: PushSubscriptionPayload): Promise<void> {
  await apiClient.request(`/preferences/${token}/push-subscriptions`, undefined, {
    method: 'POST',
    body: subscription,
  })
}
