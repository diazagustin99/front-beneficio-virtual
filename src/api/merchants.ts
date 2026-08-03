import { apiClient, type ApiItemEnvelope, type ApiListEnvelope } from './client'
import type { Merchant } from './types'

export interface PaginatedMerchants {
  items: Merchant[]
  currentPage: number
  totalPages: number
  total: number
}

export interface SearchMerchantsOptions {
  search?: string
  page?: number
  perPage?: number
  /** Only merchants with at least one active promotion; also unlocks `promotions_count`/`wallets` on each result. */
  withDiscounts?: boolean
  categoryId?: number | null
  /** Restricts results to this exact set of merchant ids — used for "Mis Preferencias". */
  merchantIds?: number[]
  /** Merchants with a real logo sort before those without one (still alphabetical within each group). */
  withLogoFirst?: boolean
}

const DEFAULT_PAGE_SIZE = 20

export async function searchMerchants(options: SearchMerchantsOptions = {}): Promise<PaginatedMerchants> {
  const response = await apiClient.request<ApiListEnvelope<Merchant>>('/merchants', {
    search: options.search,
    page: options.page,
    per_page: options.perPage ?? DEFAULT_PAGE_SIZE,
    with_discounts: options.withDiscounts,
    promotion_category_id: options.categoryId ?? undefined,
    merchant_ids: options.merchantIds,
    with_logo_first: options.withLogoFirst,
  })

  return {
    items: response.data,
    currentPage: response.current_page,
    totalPages: response.total_pages,
    total: response.total_registros,
  }
}

export async function getMerchant(id: number): Promise<Merchant> {
  const response = await apiClient.request<ApiItemEnvelope<Merchant>>(`/merchants/${id}`)

  return response.data
}
