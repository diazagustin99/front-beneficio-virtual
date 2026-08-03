import type { KeyboardEvent } from 'react'
import type { PromotionListItem } from '../../api/types'
import { MerchantAvatar } from '../MerchantAvatar/MerchantAvatar'
import { formatPromotionDateRange, formatPromotionHighlight } from '../../utils/promotionFormatting'
import { getWalletBranding } from '../../utils/walletBranding'
import styles from './PromotionCard.module.css'

interface PromotionCardProps {
  promotion: PromotionListItem
  onSelect: (promotion: PromotionListItem) => void
}

export function PromotionCard({ promotion, onSelect }: PromotionCardProps) {
  const highlight = formatPromotionHighlight(promotion)
  const dateRange = formatPromotionDateRange(promotion)
  const merchantName = promotion.merchant?.name ?? 'Comercio sin especificar'
  const logoUrl = promotion.merchant?.logo_url ?? null

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(promotion)
    }
  }

  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(promotion)}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.topRow}>
        {promotion.wallet && (
          <span
            className={styles.walletBadge}
            style={{ backgroundColor: getWalletBranding(promotion.wallet.slug).color }}
          >
            {promotion.wallet.name}
          </span>
        )}
        <span className={styles.highlight}>{highlight}</span>
      </div>
      <div className={styles.header}>
        <MerchantAvatar name={merchantName} logoUrl={logoUrl} size={44} />
        <div className={styles.headerText}>
          <h3 className={styles.title}>{promotion.title}</h3>
          <p className={styles.merchant}>{merchantName}</p>
        </div>
      </div>
      {/* Always rendered (even blank) so every card reserves the same
          vertical space regardless of whether this promotion has a
          description — otherwise cards without one end up shorter. */}
      <p className={styles.description}>{promotion.description}</p>
      <div className={styles.footer}>
        {promotion.category && <span className={styles.category}>{promotion.category.name}</span>}
        {dateRange && <span className={styles.dates}>{dateRange}</span>}
      </div>
    </article>
  )
}
