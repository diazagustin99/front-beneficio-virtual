import { useState, type ReactNode } from 'react'
import styles from './FilterSection.module.css'

interface FilterSectionProps {
  label: string
  count: number
  onClear?: () => void
  children: ReactNode
}

export function FilterSection({ label, count, onClear, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={styles.section}>
      <div className={styles.headerRow}>
        <button
          type="button"
          className={styles.header}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={styles.label}>
            {label}
            {count > 0 ? ` (${count})` : ''}
          </span>
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
            ▾
          </span>
        </button>
        {onClear && count > 0 && (
          <button type="button" className={styles.clearLink} onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  )
}
