import { useEffect, useState } from 'react'
import { listPromotions, type PaginatedPromotions } from '../../api/promotions'

interface UsePromotionsParams {
  walletSlugs: string[]
  categoryIds: number[]
  merchantIds: number[]
  validDays: string[]
  page: number
}

interface UsePromotionsResult {
  data: PaginatedPromotions | null
  isLoading: boolean
  error: string | null
}

export function usePromotions(params: UsePromotionsParams): UsePromotionsResult {
  const [data, setData] = useState<PaginatedPromotions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listPromotions({
      wallet: params.walletSlugs,
      promotion_category_id: params.categoryIds,
      merchant_id: params.merchantIds,
      valid_days: params.validDays,
      page: params.page,
    })
      .then((result) => {
        if (!cancelled) {
          setData(result)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar las promociones.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [params.walletSlugs, params.categoryIds, params.merchantIds, params.validDays, params.page])

  return { data, isLoading, error }
}
