import { apiClient, type ApiListEnvelope } from './client'
import type { Merchant } from './types'

export interface PaginatedMerchants {
  items: Merchant[]
  currentPage: number
  totalPages: number
}

const MERCHANT_SEARCH_PAGE_SIZE = 20

export async function searchMerchants(search: string, page = 1): Promise<PaginatedMerchants> {
  const response = await apiClient.request<ApiListEnvelope<Merchant>>('/merchants', {
    search,
    page,
    per_page: MERCHANT_SEARCH_PAGE_SIZE,
  })

  return {
    items: response.data,
    currentPage: response.current_page,
    totalPages: response.total_pages,
  }
}
