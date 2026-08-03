export interface Wallet {
  id: number
  name: string
  slug: string
  is_active: boolean
}

export interface Merchant {
  id: number
  name: string
  slug: string
  logo_url: string | null
  /** Only present when the request asked for `with_discounts=1`. */
  promotions_count?: number
  wallets?: Wallet[]
}

export interface PromotionCategory {
  id: number
  name: string
  slug: string
}

/**
 * Laravel's `decimal:2` cast serializes to a numeric string (e.g. "20.00")
 * to preserve trailing zeros, so these arrive as strings, not numbers.
 */
export interface PromotionListItem {
  id: number
  wallet: Wallet | null
  merchant: Merchant | null
  category: PromotionCategory | null
  title: string
  description: string | null
  discount_percentage: string | null
  fixed_amount: string | null
  cashback_percentage: string | null
  installments: number | null
  valid_days: string[]
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  url: string | null
}

export interface PromotionPaymentMethod {
  name: string
}

export interface PromotionLocation {
  scope: string | null
  province: string | null
  city: string | null
  address: string | null
  store_name: string | null
  latitude: string | null
  longitude: string | null
}

export interface AppPreference {
  token: string
  email: string | null
  email_taken: boolean
  wants_notifications: boolean
  merchants: Merchant[]
  wallets: Wallet[]
}

export interface AppNotificationData {
  date: string
  merchants: Array<{ id: number; name: string; promotions_count: number }>
}

export interface AppNotification {
  id: string
  data: AppNotificationData
  read_at: string | null
  created_at: string
}

export interface PromotionDetail {
  id: number
  wallet: Wallet | null
  merchant: Merchant | null
  category: PromotionCategory | null
  external_id: string | null
  title: string
  description: string | null
  discount_percentage: string | null
  fixed_amount: string | null
  cashback_percentage: string | null
  installments: number | null
  reimbursement_cap: string | null
  minimum_purchase: string | null
  valid_days: string[]
  starts_at: string | null
  ends_at: string | null
  terms: string | null
  url: string | null
  is_active: boolean
  payment_methods: PromotionPaymentMethod[]
  locations: PromotionLocation[]
}
