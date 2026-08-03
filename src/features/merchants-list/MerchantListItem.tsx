import { useNavigate } from 'react-router-dom'
import type { Merchant } from '../../api/types'
import { MerchantAvatar } from '../../components/MerchantAvatar/MerchantAvatar'
import { getWalletBranding } from '../../utils/walletBranding'
import styles from './MerchantListItem.module.css'

interface MerchantListItemProps {
  merchant: Merchant
}

export function MerchantListItem({ merchant }: MerchantListItemProps) {
  const navigate = useNavigate()
  const promotionsCount = merchant.promotions_count ?? 0
  const wallets = merchant.wallets ?? []

  return (
    <button type="button" className={styles.item} onClick={() => navigate(`/merchants/${merchant.id}`)}>
      <MerchantAvatar name={merchant.name} logoUrl={merchant.logo_url} size={48} />
      <div className={styles.info}>
        <p className={styles.name}>{merchant.name}</p>
        <p className={styles.count}>
          {promotionsCount} {promotionsCount === 1 ? 'descuento' : 'descuentos'}
        </p>
        <div className={styles.walletBadges}>
          {wallets.map((wallet) => (
            <span
              key={wallet.id}
              className={styles.walletBadge}
              style={{ backgroundColor: getWalletBranding(wallet.slug).color }}
            >
              {getWalletBranding(wallet.slug).code}
            </span>
          ))}
        </div>
      </div>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </button>
  )
}
