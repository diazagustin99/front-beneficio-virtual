import { useState } from 'react'
import { savePushSubscription, updateNotificationPreference } from '../api/preferences'
import { usePreference } from '../context/PreferenceContext'
import { pushErrorMessage, subscribeToPush, unsubscribeFromPush } from '../utils/pushSubscription'

/**
 * Shared by every place that lets the visitor flip push notifications on or
 * off (the notifications page's own setting, the profile page) so the
 * subscribe/unsubscribe/persist flow can't drift apart between them.
 */
export function usePushNotificationToggle() {
  const { preference, token, refresh } = usePreference()
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setIsToggling(true)
    setError(null)

    try {
      if (preference.wants_notifications) {
        await unsubscribeFromPush().catch(() => {})
        await updateNotificationPreference(token, false)
        await refresh()
        return
      }

      const result = await subscribeToPush()

      if (result.status !== 'subscribed') {
        setError(pushErrorMessage(result.status))
        return
      }

      await savePushSubscription(token, result.subscription)
      await updateNotificationPreference(token, true)
      await refresh()
    } catch {
      setError('No pudimos actualizar tus notificaciones. Probá de nuevo.')
    } finally {
      setIsToggling(false)
    }
  }

  return { isEnabled: preference.wants_notifications, isToggling, error, toggle }
}
