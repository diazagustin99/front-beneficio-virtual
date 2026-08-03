import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPreferenceNotifications } from '../../api/preferences'
import { usePreference } from '../../context/PreferenceContext'
import styles from './Header.module.css'

export function Header() {
  const { token } = usePreference()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    getPreferenceNotifications(token, 1, 100)
      .then((result) => {
        if (!cancelled) {
          setUnreadCount(result.items.filter((notification) => notification.read_at === null).length)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <img src="/pwa-192x192.png" alt="" width={32} height={32} className={styles.logo} />
        <span className={styles.title}>Beneficio Virtual</span>
        <Link to="/notifications" className={styles.notificationsLink} aria-label="Notificaciones">
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
            <path d="M12 2a6 6 0 0 0-6 6v3.09c0 .55-.16 1.09-.46 1.55L4.2 15.1a1 1 0 0 0 .84 1.55h13.92a1 1 0 0 0 .84-1.55l-1.34-2.46a3 3 0 0 1-.46-1.55V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.83-2H9.17A3 3 0 0 0 12 22Z" />
          </svg>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </Link>
      </div>
    </header>
  )
}
