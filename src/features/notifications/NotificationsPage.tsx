import { useState, type KeyboardEvent } from 'react'
import { savePushSubscription, updateNotificationPreference } from '../../api/preferences'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { usePreference } from '../../context/PreferenceContext'
import { pushErrorMessage, subscribeToPush, unsubscribeFromPush } from '../../utils/pushSubscription'
import { useNotifications } from './useNotifications'
import styles from './NotificationsPage.module.css'

function formatMerchantsList(names: string[]): string {
  if (names.length <= 1) {
    return names[0] ?? ''
  }

  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function NotificationsPage() {
  const { preference, token, refresh } = usePreference()
  const { notifications, isLoading, isLoadingMore, hasMore, loadMore, markRead } = useNotifications(token)

  const [isTogglingPush, setIsTogglingPush] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  // Available regardless of whether the session has an email attached —
  // the token alone is enough to receive and manage notifications.
  async function handleTogglePush() {
    setIsTogglingPush(true)
    setPushError(null)

    try {
      if (preference.wants_notifications) {
        await unsubscribeFromPush().catch(() => {})
        await updateNotificationPreference(token, false)
        await refresh()
        return
      }

      const result = await subscribeToPush()

      if (result.status !== 'subscribed') {
        setPushError(pushErrorMessage(result.status))
        return
      }

      await savePushSubscription(token, result.subscription)
      await updateNotificationPreference(token, true)
      await refresh()
    } catch {
      setPushError('No pudimos actualizar tus notificaciones. Probá de nuevo.')
    } finally {
      setIsTogglingPush(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, id: string, isUnread: boolean) {
    if (isUnread && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      markRead(id)
    }
  }

  const pushSetting = (
    <div className={styles.pushSetting}>
      <div>
        <p className={styles.pushSettingTitle}>Notificaciones push</p>
        <p className={styles.pushSettingSubtitle}>
          {preference.wants_notifications
            ? 'Activadas: te avisamos cuando tus comercios tengan descuentos.'
            : 'Activalas para recibir un aviso del navegador cuando tus comercios tengan descuentos.'}
        </p>
      </div>
      <button type="button" className={styles.pushToggleButton} onClick={handleTogglePush} disabled={isTogglingPush}>
        {isTogglingPush ? '...' : preference.wants_notifications ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <div className={styles.page}>
        {pushSetting}
        {pushError && <p className={styles.error}>{pushError}</p>}
        <p className={styles.status}>Cargando notificaciones...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.page}>
        {pushSetting}
        {pushError && <p className={styles.error}>{pushError}</p>}
        <EmptyState message="Todavía no tenés notificaciones." />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notificaciones</h1>
      {pushSetting}
      {pushError && <p className={styles.error}>{pushError}</p>}
      <ul className={styles.list}>
        {notifications.map((notification) => {
          const isUnread = notification.read_at === null
          const merchantNames = notification.data.merchants.map((merchant) => merchant.name)

          return (
            <li key={notification.id}>
              <article
                className={`${styles.item} ${isUnread ? styles.unread : ''}`}
                role={isUnread ? 'button' : undefined}
                tabIndex={isUnread ? 0 : undefined}
                onClick={() => isUnread && markRead(notification.id)}
                onKeyDown={(event) => handleKeyDown(event, notification.id, isUnread)}
              >
                <p className={styles.itemTitle}>Hoy tenés descuentos en: {formatMerchantsList(merchantNames)}</p>
                <p className={styles.itemDate}>{new Date(notification.created_at).toLocaleDateString('es-AR')}</p>
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
