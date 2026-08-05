import { type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { usePreference } from '../../context/PreferenceContext'
import { usePushNotificationToggle } from '../../hooks/usePushNotificationToggle'
import { useNotifications } from './useNotifications'
import styles from './NotificationsPage.module.css'

function formatMerchantsList(names: string[]): string {
  if (names.length <= 1) {
    return names[0] ?? ''
  }

  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

const MAX_MERCHANT_CHIPS = 3

export function NotificationsPage() {
  const navigate = useNavigate()
  const { token } = usePreference()
  const { notifications, isLoading, isLoadingMore, hasMore, loadMore, markRead } = useNotifications(token)
  const { isEnabled: wantsNotifications, isToggling: isTogglingPush, error: pushError, toggle: handleTogglePush } =
    usePushNotificationToggle()

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, id: string, isUnread: boolean) {
    if (isUnread && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      markRead(id)
    }
  }

  const header = (
    <header className={styles.header}>
      <button type="button" className={styles.backButton} onClick={() => navigate(-1)} aria-label="Volver">
        ‹
      </button>
      <h1 className={styles.title}>Notificaciones</h1>
    </header>
  )

  const pushSetting = (
    <div className={styles.pushSetting}>
      <div>
        <p className={styles.pushSettingTitle}>Notificaciones push</p>
        <p className={styles.pushSettingSubtitle}>
          {wantsNotifications
            ? 'Activadas: te avisamos cuando tus comercios tengan descuentos.'
            : 'Activalas para recibir un aviso del navegador cuando tus comercios tengan descuentos.'}
        </p>
      </div>
      <button type="button" className={styles.pushToggleButton} onClick={handleTogglePush} disabled={isTogglingPush}>
        {isTogglingPush ? '...' : wantsNotifications ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <div className={styles.page}>
        {header}
        {pushSetting}
        {pushError && <p className={styles.error}>{pushError}</p>}
        <EmptyState message="Cargando notificaciones..." isLoading />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.page}>
        {header}
        {pushSetting}
        {pushError && <p className={styles.error}>{pushError}</p>}
        <EmptyState message="Todavía no tenés notificaciones." />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {header}
      {pushSetting}
      {pushError && <p className={styles.error}>{pushError}</p>}
      <ul className={styles.list}>
        {notifications.map((notification) => {
          const isUnread = notification.read_at === null
          const merchantNames = notification.data.merchants.map((merchant) => merchant.name)
          const visibleNames = merchantNames.slice(0, MAX_MERCHANT_CHIPS)
          const extraCount = merchantNames.length - visibleNames.length
          const totalPromotions = notification.data.merchants.reduce(
            (sum, merchant) => sum + merchant.promotions_count,
            0,
          )

          return (
            <li key={notification.id}>
              <article
                className={`${styles.item} ${isUnread ? styles.unread : ''}`}
                role={isUnread ? 'button' : undefined}
                tabIndex={isUnread ? 0 : undefined}
                onClick={() => isUnread && markRead(notification.id)}
                onKeyDown={(event) => handleKeyDown(event, notification.id, isUnread)}
                aria-label={isUnread ? `Marcar como leída: descuentos en ${formatMerchantsList(merchantNames)}` : undefined}
              >
                <span className={styles.itemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                    <path d="M12 2a6 6 0 0 0-6 6v3.09c0 .55-.16 1.09-.46 1.55L4.2 15.1a1 1 0 0 0 .84 1.55h13.92a1 1 0 0 0 .84-1.55l-1.34-2.46a3 3 0 0 1-.46-1.55V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.83-2H9.17A3 3 0 0 0 12 22Z" />
                  </svg>
                </span>

                <div className={styles.itemBody}>
                  <div className={styles.itemHeadRow}>
                    <p className={styles.itemTitle}>Nuevos descuentos hoy</p>
                    {isUnread && <span className={styles.newBadge}>Nuevo</span>}
                  </div>

                  <div className={styles.merchantChips}>
                    {visibleNames.map((name) => (
                      <span key={name} className={styles.merchantChip}>
                        {name}
                      </span>
                    ))}
                    {extraCount > 0 && <span className={styles.merchantChip}>+{extraCount}</span>}
                  </div>

                  <div className={styles.itemFooter}>
                    <span className={styles.itemDate}>{new Date(notification.created_at).toLocaleDateString('es-AR')}</span>
                    <span className={styles.itemCount}>
                      {totalPromotions} {totalPromotions === 1 ? 'descuento' : 'descuentos'}
                    </span>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>

      {hasMore && (
        <button type="button" className={styles.loadMoreButton} onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </div>
  )
}
