import { apiClient, type ApiItemEnvelope, type ApiListEnvelope } from './client'
import type { PromotionDetail, PromotionListItem, PromotionSnapshot } from './types'

export interface PromotionFilters {
  wallet?: string
  promotion_category_id?: number
  merchant_id?: number
  search?: string
  page?: number
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
    search: filters.search,
    page: filters.page,
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

export async function getPromotionSnapshots(id: number): Promise<PromotionSnapshot[]> {
  const response = await apiClient.request<ApiListEnvelope<PromotionSnapshot>>(`/promotions/${id}/snapshots`)

  return response.data
}
