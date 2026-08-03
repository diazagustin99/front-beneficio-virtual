import { apiClient, type ApiItemEnvelope, type ApiListEnvelope } from './client'
import type { PromotionDetail, PromotionListItem } from './types'

export interface PromotionFilters {
  wallet?: string[]
  promotion_category_id?: number[]
  merchant_id?: number[]
  valid_days?: string[]
  search?: string
  page?: number
  per_page?: number
}

export interface PaginatedPromotions {
  items: PromotionListItem[]
  currentPage: number
  totalPages: number
  totalResults: number
}

export async function listPromotions(filters: PromotionFilters): Promise<PaginatedPromotions> {
  const response = await apiClient.request<ApiListEnvelope<PromotionListItem>>('/promotions', {
    wallet: filters.wallet,
    promotion_category_id: filters.promotion_category_id,
    merchant_id: filters.merchant_id,
    valid_days: filters.valid_days,
    search: filters.search,
    page: filters.page,
    per_page: filters.per_page,
    is_active: true,
  })

  return {
    items: response.data,
    currentPage: response.current_page,
    totalPages: response.total_pages,
    totalResults: response.total_registros,
  }
}

export async function getPromotion(id: number): Promise<PromotionDetail> {
  const response = await apiClient.request<ApiItemEnvelope<PromotionDetail>>(`/promotions/${id}`)

  return response.data
}

/**
 * One promotion per active wallet, already picked as "the best deal" by the
 * backend — a single request instead of fetching every wallet's promotions
 * and ranking them client-side (what made the welcome screen slow to load).
 */
export async function listWelcomeCarousel(): Promise<PromotionListItem[]> {
  const response = await apiClient.request<ApiListEnvelope<PromotionListItem>>('/welcome-carousel')

  return response.data
}

