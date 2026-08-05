import { useEffect, useState } from 'react'
import { followWallet, unfollowWallet } from '../../api/preferences'
import type { Wallet } from '../../api/types'
import { listWallets } from '../../api/wallets'
import { usePreference } from '../../context/PreferenceContext'
import { usePushNotificationToggle } from '../../hooks/usePushNotificationToggle'
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt'
import { getWalletBranding } from '../../utils/walletBranding'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { preference, token, refresh } = usePreference()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [savingWalletId, setSavingWalletId] = useState<number | null>(null)

  const { isEnabled: wantsNotifications, isToggling: isTogglingPush, error: pushError, toggle: handleTogglePush } =
    usePushNotificationToggle()
  const { canInstall, promptInstall } = usePwaInstallPrompt()
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    listWallets()
      .then(setWallets)
      .catch(() => setWallets([]))
  }, [])

  const followedWalletIds = new Set(preference.wallets.map((wallet) => wallet.id))
  const accountInitial = preference.email ? preference.email.charAt(0).toUpperCase() : 'BV'

  async function handleToggleWallet(walletId: number, isFollowed: boolean) {
    setSavingWalletId(walletId)

    try {
      if (isFollowed) {
        await unfollowWallet(token, walletId)
      } else {
        await followWallet(token, walletId)
      }

      await refresh()
    } catch {
      // Best-effort — the switch just doesn't flip, nothing destructive happened.
    } finally {
      setSavingWalletId(null)
    }
  }

  async function handleInstall() {
    setIsInstalling(true)

    try {
      await promptInstall()
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Mi perfil</h1>
      <p className={styles.subheading}>Personalizá tu experiencia</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cuenta</h2>
        <div className={styles.accountCard}>
          <span className={styles.accountAvatar}>{accountInitial}</span>
          <div className={styles.accountInfo}>
            <p className={styles.accountPrimary}>{preference.email ?? 'Sin cuenta registrada'}</p>
            <p className={styles.accountSecondary}>
              {preference.email ? 'Cuenta activa' : 'Completaste el onboarding como invitado'}
            </p>
          </div>
          {preference.email && <span className={styles.accountBadge}>Activo</span>}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Mis billeteras</h2>
        <div className={styles.walletList}>
          {wallets.map((wallet) => {
            const isFollowed = followedWalletIds.has(wallet.id)
            const branding = getWalletBranding(wallet.slug)
            const isSaving = savingWalletId === wallet.id

            return (
              <div key={wallet.id} className={styles.walletRow}>
                <span className={styles.walletIcon} style={{ backgroundColor: branding.color }}>
                  {branding.code}
                </span>
                <span className={styles.walletName}>{wallet.name}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFollowed}
                  aria-label={wallet.name}
                  className={`${styles.switch} ${isFollowed ? styles.switchOn : ''}`}
                  disabled={isSaving}
                  onClick={() => handleToggleWallet(wallet.id, isFollowed)}
                >
                  <span className={styles.switchKnob} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>App</h2>
        <div className={styles.appList}>
          <div className={styles.appRow}>
            <span className={styles.appIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                <path d="M12 2a6 6 0 0 0-6 6v3.09c0 .55-.16 1.09-.46 1.55L4.2 15.1a1 1 0 0 0 .84 1.55h13.92a1 1 0 0 0 .84-1.55l-1.34-2.46a3 3 0 0 1-.46-1.55V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.83-2H9.17A3 3 0 0 0 12 22Z" />
              </svg>
            </span>
            <div className={styles.appInfo}>
              <p className={styles.appTitle}>Notificaciones</p>
              <p className={styles.appSubtitle}>Recibí alertas de nuevas promos</p>
            </div>
            <button
              type="button"
              className={`${styles.appAction} ${wantsNotifications ? styles.appActionOutline : ''}`}
              onClick={handleTogglePush}
              disabled={isTogglingPush}
            >
              {isTogglingPush ? '...' : wantsNotifications ? 'Desactivar' : 'Activar'}
            </button>
          </div>
          {pushError && <p className={styles.error}>{pushError}</p>}

          <div className={styles.appRow}>
            <span className={styles.appIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                <path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1ZM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" />
              </svg>
            </span>
            <div className={styles.appInfo}>
              <p className={styles.appTitle}>Instalar app</p>
              <p className={styles.appSubtitle}>Acceso rápido desde tu pantalla de inicio</p>
            </div>
            {canInstall ? (
              <button type="button" className={styles.appAction} onClick={handleInstall} disabled={isInstalling}>
                {isInstalling ? 'Instalando...' : 'Instalar'}
              </button>
            ) : (
              <span className={styles.appUnavailable}>No disponible</span>
            )}
          </div>
        </div>
      </section>

      <div className={styles.footer}>
        <span className={styles.footerAvatar} aria-hidden="true">
          BV
        </span>
        <span>Beneficio Virtual · v1.0.0</span>
      </div>
    </main>
  )
}
