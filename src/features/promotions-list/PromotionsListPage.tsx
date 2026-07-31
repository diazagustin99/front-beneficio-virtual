import { useMemo, useState } from 'react'
import { PromotionCard } from '../../components/PromotionCard/PromotionCard'
import { PromotionDetailModal } from '../../components/PromotionDetailModal/PromotionDetailModal'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { PromotionFilters, type PromotionFiltersValue } from './PromotionFilters'
import { usePromotions } from './usePromotions'
import styles from './PromotionsListPage.module.css'

const INITIAL_FILTERS: PromotionFiltersValue = {
  walletSlugs: [],
  categoryIds: [],
  selectedMerchants: [],
  merchantSearch: '',
  validDays: [],
}

export function PromotionsListPage() {
  const [filters, setFilters] = useState<PromotionFiltersValue>(INITIAL_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null)

  // `.map()` would otherwise create a brand-new array on every render (this
  // component re-renders whenever usePromotions's own state changes), which
  // as a hook dependency looks "changed" every time and re-triggers the
  // fetch forever. Memoizing keeps the reference stable across renders where
  // the actual merchant selection didn't change.
  const merchantIds = useMemo(
    () => filters.selectedMerchants.map((merchant) => merchant.id),
    [filters.selectedMerchants],
  )

  const { data, isLoading, error } = usePromotions({
    walletSlugs: filters.walletSlugs,
    categoryIds: filters.categoryIds,
    merchantIds,
    validDays: filters.validDays,
    page,
  })

  function handleFiltersChange(next: PromotionFiltersValue) {
    setFilters(next)
    setPage(1)
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Promociones</h1>

      <PromotionFilters value={filters} onChange={handleFiltersChange} />

      {isLoading && <EmptyState message="Cargando promociones..." />}
      {!isLoading && error && <EmptyState message={error} />}
      {!isLoading && !error && data && data.items.length === 0 && (
        <EmptyState message="No encontramos promociones con estos filtros." />
      )}

      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <div className={styles.grid}>
            {data.items.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                onSelect={(selected) => setSelectedPromotionId(selected.id)}
              />
            ))}
          </div>

          {data.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Paginación de promociones">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={data.currentPage <= 1}
              >
                Anterior
              </button>
              <span className={styles.pageIndicator}>
                Página {data.currentPage} de {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={data.currentPage >= data.totalPages}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}

      <PromotionDetailModal promotionId={selectedPromotionId} onClose={() => setSelectedPromotionId(null)} />
    </main>
  )
}
