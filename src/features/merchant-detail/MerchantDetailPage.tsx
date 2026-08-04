import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMerchant } from '../../api/merchants'
import { followMerchant, unfollowMerchant } from '../../api/preferences'
import { listPromotions } from '../../api/promotions'
import type { Merchant, PromotionListItem } from '../../api/types'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { MerchantAvatar } from '../../components/MerchantAvatar/MerchantAvatar'
import { PromotionDetailModal } from '../../components/PromotionDetailModal/PromotionDetailModal'
import { WeekdayChips } from '../../components/WeekdayChips/WeekdayChips'
import { usePreference } from '../../context/PreferenceContext'
import { formatPromotionDateRange, formatPromotionHighlight } from '../../utils/promotionFormatting'
import { getWalletBranding } from '../../utils/walletBranding'
import styles from './MerchantDetailPage.module.css'

const PROMOTIONS_PER_MERCHANT = 100

function mostFrequentCategoryName(promotions: PromotionListItem[]): string | null {
  const counts = new Map<string, number>()

  for (const promotion of promotions) {
    if (promotion.category) {
      counts.set(promotion.category.name, (counts.get(promotion.category.name) ?? 0) + 1)
    }
  }

  let best: string | null = null
  let bestCount = 0

  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }

  return best
}

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const merchantId = Number(id)
  const navigate = useNavigate()
  const { preference, token, refresh } = usePreference()

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [promotions, setPromotions] = useState<PromotionListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null)
  const [isSavingFollow, setIsSavingFollow] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    Promise.all([getMerchant(merchantId), listPromotions({ merchant_id: [merchantId], per_page: PROMOTIONS_PER_MERCHANT })])
      .then(([merchantResult, promotionsResult]) => {
        if (!cancelled) {
          setMerchant(merchantResult)
          setPromotions(promotionsResult.items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMerchant(null)
          setPromotions([])
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
  }, [merchantId])

  const followedWalletSlugs = new Set(preference.wallets.map((wallet) => wallet.slug))
  const isFollowed = preference.merchants.some((followed) => followed.id === merchantId)

  // Recomputed at render time (not baked into fetched state) so it stays
  // correct if the user's wallet selection changes without a refetch.
  const sortedPromotions = [...promotions].sort((a, b) => {
    const aIsFavorite = Boolean(a.wallet && followedWalletSlugs.has(a.wallet.slug))
    const bIsFavorite = Boolean(b.wallet && followedWalletSlugs.has(b.wallet.slug))

    if (aIsFavorite === bIsFavorite) {
      return 0
    }

    return aIsFavorite ? -1 : 1
  })

  const hasFavoriteMatch = sortedPromotions.some(
    (promotion) => promotion.wallet && followedWalletSlugs.has(promotion.wallet.slug),
  )
  const categoryName = mostFrequentCategoryName(sortedPromotions)

  async function handleToggleFollow() {
    if (!merchant) {
      return
    }

    setIsSavingFollow(true)

    try {
      if (isFollowed) {
        await unfollowMerchant(token, merchant.id)
      } else {
        await followMerchant(token, merchant.id)
      }

      await refresh()
    } catch {
      // Best-effort — the button just doesn't flip, nothing destructive happened.
    } finally {
      setIsSavingFollow(false)
    }
  }

  if (isLoading) {
    return <EmptyState message="Cargando comercio..." isLoading />
  }

  if (!merchant) {
    return <EmptyState message="No pudimos encontrar este comercio." />
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleToggleFollow}
          disabled={isSavingFollow}
        >
          {isFollowed ? '♥ Guardado' : '♡ Guardar'}
        </button>
      </header>

      <div className={styles.merchantHeader}>
        <MerchantAvatar name={merchant.name} logoUrl={merchant.logo_url} size={72} />
        <h1 className={styles.merchantName}>{merchant.name}</h1>
        {categoryName && <p className={styles.merchantCategory}>{categoryName}</p>}
        <p className={styles.merchantCount}>
          {sortedPromotions.length} {sortedPromotions.length === 1 ? 'descuento disponible' : 'descuentos disponibles'}
        </p>
      </div>

      {hasFavoriteMatch && (
        <p className={styles.highlightBanner}>★ Los descuentos de tus billeteras aparecen primero</p>
      )}

      {sortedPromotions.length === 0 && <EmptyState message="Este comercio no tiene descuentos activos ahora." />}

      <div className={styles.promoList}>
        {sortedPromotions.map((promotion) => {
          const isFavoriteWallet = Boolean(promotion.wallet && followedWalletSlugs.has(promotion.wallet.slug))
          const dateRange = formatPromotionDateRange(promotion)
          const highlight = formatPromotionHighlight(promotion)

          return (
            <button
              key={promotion.id}
              type="button"
              className={`${styles.promoCard} ${isFavoriteWallet ? styles.promoCardFavorite : ''}`}
              onClick={() => setSelectedPromotionId(promotion.id)}
            >
              <div className={styles.promoTopRow}>
                <span className={styles.promoTopRowLeft}>
                  {promotion.wallet && (
                    <span
                      className={styles.walletBadge}
                      style={{ backgroundColor: getWalletBranding(promotion.wallet.slug).color }}
                    >
                      {promotion.wallet.name}
                    </span>
                  )}
                  {isFavoriteWallet && <span className={styles.favoriteBadge}>★ Favorita</span>}
                </span>
                {highlight && <span className={styles.promoHighlight}>{highlight}</span>}
              </div>
              <p className={styles.promoTitle}>{promotion.title}</p>
              <p className={styles.promoMeta}>
                {[promotion.category?.name, dateRange].filter(Boolean).join(' · ')}
              </p>
              <WeekdayChips validDays={promotion.valid_days} />
            </button>
          )
        })}
      </div>

      <PromotionDetailModal promotionId={selectedPromotionId} onClose={() => setSelectedPromotionId(null)} />
    </main>
  )
}
