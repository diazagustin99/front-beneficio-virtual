import { useEffect, useState } from 'react'
import type { PromotionCategory } from '../../api/types'
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

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const filtered = categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase()))

  function handleSelect(id: number | null) {
    onSelect(id)
    onClose()
  }

  return (
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
    </div>
  )
}
