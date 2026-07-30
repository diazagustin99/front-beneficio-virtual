import { apiClient, type ApiListEnvelope } from './client'
import type { PromotionCategory } from './types'

export async function listPromotionCategories(): Promise<PromotionCategory[]> {
  const response = await apiClient.request<ApiListEnvelope<PromotionCategory>>('/promotion-categories')

  return response.data
}
