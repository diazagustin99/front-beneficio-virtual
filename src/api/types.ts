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
  version: number
  is_active: boolean
  payment_methods: PromotionPaymentMethod[]
  locations: PromotionLocation[]
}

/**
 * `data` is a snapshot of the promotion's tracked fields exactly as they
 * were before the change that produced the next version — see
 * `Promotion::TRACKED_FIELDS` on the backend for the full field set.
 */
export interface PromotionSnapshot {
  id: number
  version: number
  data: {
    title?: string
    discount_percentage?: string | null
    cashback_percentage?: string | null
    fixed_amount?: string | null
    terms?: string | null
    [key: string]: unknown
  }
  scrape_run_id: number
  created_at: string
}
