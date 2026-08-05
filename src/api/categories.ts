import { apiClient, type ApiListEnvelope } from './client'
import type { PromotionCategory } from './types'

// Categories don't change during a session — fetched once and reused by
// every caller instead of re-hitting the API (and re-shuffling the category
// tab layout) on every remount. Cached as a promise, not a resolved array,
// so concurrent callers before the first response share one request; reset
// on failure so a later call can retry instead of failing forever.
let cachedCategories: Promise<PromotionCategory[]> | null = null

export async function listPromotionCategories(): Promise<PromotionCategory[]> {
  if (!cachedCategories) {
    cachedCategories = apiClient
      .request<ApiListEnvelope<PromotionCategory>>('/promotion-categories')
      .then((response) => response.data)
      .catch((error: unknown) => {
        cachedCategories = null
        throw error
      })
  }

  return cachedCategories
}
