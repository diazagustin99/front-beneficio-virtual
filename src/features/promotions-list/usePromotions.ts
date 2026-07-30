import { useEffect, useState } from 'react'
import { listPromotions, type PaginatedPromotions } from '../../api/promotions'

interface UsePromotionsParams {
  wallet: string
  categoryId: number | undefined
  merchantId: number | undefined
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
      wallet: params.wallet || undefined,
      promotion_category_id: params.categoryId,
      merchant_id: params.merchantId,
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
  }, [params.wallet, params.categoryId, params.merchantId, params.page])

  return { data, isLoading, error }
}
