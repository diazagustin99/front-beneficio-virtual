import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <img src="/pwa-192x192.png" alt="" width={32} height={32} className={styles.logo} />
        <span className={styles.title}>Beneficio Virtual</span>
      </div>
    </header>
  )
}
