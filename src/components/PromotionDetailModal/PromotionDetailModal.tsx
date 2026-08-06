import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getPromotion } from '../../api/promotions'
import type { PromotionDetail } from '../../api/types'
import { usePreference } from '../../context/PreferenceContext'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { formatPromotionDateRange, formatPromotionHighlight } from '../../utils/promotionFormatting'
import { getWalletBranding } from '../../utils/walletBranding'
import { MerchantAvatar } from '../MerchantAvatar/MerchantAvatar'
import styles from './PromotionDetailModal.module.css'

interface PromotionDetailModalProps {
  promotionId: number | null
  onClose: () => void
}

export function PromotionDetailModal({ promotionId, onClose }: PromotionDetailModalProps) {
  const [detail, setDetail] = useState<PromotionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (promotionId === null) {
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setDetail(null)

    getPromotion(promotionId)
      .then((result) => {
        if (cancelled) {
          return
        }

        setDetail(result)
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar el detalle de la promoción.')
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
  }, [promotionId])

  useBodyScrollLock(promotionId !== null)
  useEscapeKey(promotionId !== null, onClose)

  const { preference } = usePreference()

  if (promotionId === null) {
    return null
  }

  const highlight = detail ? formatPromotionHighlight(detail) : null
  const dateRange = detail ? formatPromotionDateRange(detail) : null
  const merchantName = detail?.merchant?.name ?? 'Comercio sin especificar'
  const logoUrl = detail?.merchant?.logo_url ?? null
  const isFavoriteWallet = Boolean(
    detail?.wallet && preference.wallets.some((wallet) => wallet.slug === detail.wallet?.slug),
  )

  // Rendered into `document.body` rather than in place: this modal is
  // mounted deep inside a page whose own root has an entrance `animation`
  // (see e.g. MerchantDetailPage.module.css `.page`). Any element with a
  // computed opacity below 1 — which that page root is, for the duration of
  // its own fade-in — forms its own stacking context, and traps this
  // modal's `z-index` inside it. That let the app's bottom nav (a sibling
  // z-indexed element outside that page) paint over the modal's own
  // buttons. A portal sidesteps the whole ancestor-stacking-context problem
  // by making `document.body` the modal's only parent.
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={detail?.title ?? 'Detalle de la promoción'}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.closeButton} aria-label="Cerrar" onClick={onClose}>
          ×
        </button>

        {isLoading && <p className={styles.status}>Cargando detalle...</p>}
        {!isLoading && error && <p className={styles.status}>{error}</p>}

        {!isLoading && !error && detail && (
          <div className={styles.content}>
            <div className={styles.header}>
              <MerchantAvatar name={merchantName} logoUrl={logoUrl} size={56} />
              <div>
                {detail.wallet && (
                  <span
                    className={styles.walletBadge}
                    style={{ backgroundColor: getWalletBranding(detail.wallet.slug).color }}
                  >
                    {detail.wallet.name}
                  </span>
                )}
                {isFavoriteWallet && <span className={styles.favoriteBadge}>Tu billetera</span>}
                <h2 className={styles.title}>{detail.title}</h2>
                <p className={styles.merchant}>{merchantName}</p>
              </div>
            </div>

            {highlight && <p className={styles.highlight}>{highlight}</p>}
            {detail.description && <p className={styles.description}>{detail.description}</p>}

            <dl className={styles.details}>
              {detail.category && (
                <div className={styles.detailRow}>
                  <dt>Categoría</dt>
                  <dd>{detail.category.name}</dd>
                </div>
              )}
              {dateRange && (
                <div className={styles.detailRow}>
                  <dt>Vigencia</dt>
                  <dd>{dateRange}</dd>
                </div>
              )}
              {detail.valid_days.length > 0 && (
                <div className={styles.detailRow}>
                  <dt>Días válidos</dt>
                  <dd>{detail.valid_days.join(', ')}</dd>
                </div>
              )}
              {detail.installments && (
                <div className={styles.detailRow}>
                  <dt>Cuotas</dt>
                  <dd>{detail.installments}</dd>
                </div>
              )}
              {detail.minimum_purchase && (
                <div className={styles.detailRow}>
                  <dt>Compra mínima</dt>
                  <dd>${Number(detail.minimum_purchase).toLocaleString('es-AR')}</dd>
                </div>
              )}
              {detail.reimbursement_cap && (
                <div className={styles.detailRow}>
                  <dt>Tope de reintegro</dt>
                  <dd>${Number(detail.reimbursement_cap).toLocaleString('es-AR')}</dd>
                </div>
              )}
              {detail.payment_methods.length > 0 && (
                <div className={styles.detailRow}>
                  <dt>Medios de pago</dt>
                  <dd>{detail.payment_methods.map((method) => method.name).join(', ')}</dd>
                </div>
              )}
            </dl>

            {detail.terms && (
              <div className={styles.terms}>
                <h3>Términos y condiciones</h3>
                <p>{detail.terms}</p>
              </div>
            )}

            {detail.url && (
              <a className={styles.visitLink} href={detail.url} target="_blank" rel="noreferrer noopener">
                Ir a la promoción
              </a>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
