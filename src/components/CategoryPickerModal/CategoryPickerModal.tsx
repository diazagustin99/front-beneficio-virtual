import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { PromotionCategory } from '../../api/types'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import styles from './CategoryPickerModal.module.css'

interface CategoryPickerModalProps {
  categories: PromotionCategory[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  onClose: () => void
}

/** The full category list behind the home screen's "+" chip — a search box
 * plus a scrollable, select-like list, for when the 5 pinned tabs aren't
 * the one the visitor actually wants. */
export function CategoryPickerModal({ categories, selectedId, onSelect, onClose }: CategoryPickerModalProps) {
  const [search, setSearch] = useState('')

  useBodyScrollLock(true)
  useEscapeKey(true, onClose)

  const filtered = categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase()))

  function handleSelect(id: number | null) {
    onSelect(id)
    onClose()
  }

  // Rendered into `document.body` — see the same comment in
  // PromotionDetailModal.tsx: mounted in place, this modal would inherit
  // whatever page it opens on top of, and that page's own root has an
  // entrance-animation-driven opacity that traps this modal's `z-index`
  // below the app's bottom nav.
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Elegir categoría"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Categorías</h2>
          <button type="button" className={styles.closeButton} aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar categoría..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoFocus
        />

        <div className={styles.list}>
          <button
            type="button"
            className={`${styles.option} ${selectedId === null ? styles.optionSelected : ''}`}
            onClick={() => handleSelect(null)}
          >
            Todos
          </button>
          {filtered.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.option} ${selectedId === category.id ? styles.optionSelected : ''}`}
              onClick={() => handleSelect(category.id)}
            >
              {category.name}
            </button>
          ))}
          {filtered.length === 0 && <p className={styles.empty}>No se encontraron categorías.</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
