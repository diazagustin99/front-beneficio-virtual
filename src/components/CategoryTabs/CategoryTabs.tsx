import { useState } from 'react'
import type { PromotionCategory } from '../../api/types'
import { CategoryPickerModal } from '../CategoryPickerModal/CategoryPickerModal'
import styles from './CategoryTabs.module.css'

interface LeadingChip {
  label: string
  active: boolean
  onClick: () => void
}

interface CategoryTabsProps {
  categories: PromotionCategory[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  /** An extra pinned chip before "Todos" — e.g. "Mis Preferencias" on the home screen. Toggles independently of category selection. */
  leadingChip?: LeadingChip
  /** Caps how many real categories show inline before a "+" chip that opens
   * the full searchable list — omit to show every category inline (the
   * onboarding picker's behavior, unchanged). */
  maxVisible?: number
}

/** `null` selection means "Todos" — a synthetic first tab, not a real category. */
export function CategoryTabs({ categories, selectedId, onSelect, leadingChip, maxVisible }: CategoryTabsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const capped = typeof maxVisible === 'number'
  const pinnedFirst = capped ? categories.slice(0, maxVisible) : categories
  // The category picked from behind "+" might not be one of the pinned
  // ones — pin it too so its active state stays visible instead of looking
  // like nothing is selected.
  const selectedOutsidePinned =
    capped && selectedId !== null && !pinnedFirst.some((category) => category.id === selectedId)
      ? (categories.find((category) => category.id === selectedId) ?? null)
      : null
  const visibleCategories = selectedOutsidePinned
    ? [selectedOutsidePinned, ...pinnedFirst.slice(0, Math.max(0, (maxVisible ?? 0) - 1))]
    : pinnedFirst
  const showExpandButton = capped && categories.length > (maxVisible ?? 0)

  return (
    <>
      <div className={styles.tabs}>
        {leadingChip && (
          <button
            type="button"
            className={`${styles.tab} ${leadingChip.active ? styles.tabActive : ''}`}
            onClick={leadingChip.onClick}
          >
            {leadingChip.label}
          </button>
        )}
        <button
          type="button"
          className={`${styles.tab} ${selectedId === null ? styles.tabActive : ''}`}
          onClick={() => onSelect(null)}
        >
          Todos
        </button>
        {visibleCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`${styles.tab} ${selectedId === category.id ? styles.tabActive : ''}`}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
          </button>
        ))}
        {showExpandButton && (
          <button
            type="button"
            className={styles.expandButton}
            aria-label="Ver todas las categorías"
            onClick={() => setIsPickerOpen(true)}
          >
            +
          </button>
        )}
      </div>

      {isPickerOpen && (
        <CategoryPickerModal
          categories={categories}
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </>
  )
}
