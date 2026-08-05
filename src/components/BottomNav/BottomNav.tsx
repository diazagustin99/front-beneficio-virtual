import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

function tabClassName({ isActive }: { isActive: boolean }): string {
  return `${styles.tab} ${isActive ? styles.tabActive : ''}`
}

export function BottomNav() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" end className={tabClassName}>
        <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
          <path d="M12 3.2 3 10.5V21a1 1 0 0 0 1 1h5.5a1 1 0 0 0 1-1v-5.5h3V21a1 1 0 0 0 1 1H20a1 1 0 0 0 1-1V10.5L12 3.2Z" />
        </svg>
        <span>Comercios</span>
      </NavLink>
      <NavLink to="/profile" end className={tabClassName}>
        <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
          <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.14 0-8 2.1-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.9-3.86-5-8-5Z" />
        </svg>
        <span>Mi perfil</span>
      </NavLink>
    </nav>
  )
}
