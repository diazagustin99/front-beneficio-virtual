import { useState } from 'react'
import type { PromotionCategory } from '../../api/types'
import { CategoryPickerModal } from '../CategoryPickerModal/CategoryPickerModal'
import styles from './CategoryTabs.module.css'

/** `null` means "Todos", `'leading'` means the leading chip (e.g. "Mis
 * Preferencias") — all three live in the same mutually-exclusive group. */
export type CategorySelection = number | 'leading' | null

interface LeadingChip {
  label: string
}

interface CategoryTabsProps {
  categories: PromotionCategory[]
  selectedId: CategorySelection
  onSelect: (id: CategorySelection) => void
  /** An extra pinned chip before "Todos" — e.g. "Mis Preferencias". Selected
   * via the `'leading'` sentinel, same one-at-a-time behavior as every
   * other tab: picking it clears "Todos"/the category, and picking any of
   * those clears it. */
  leadingChip?: LeadingChip
  /** Caps how many real categories show inline before a "+" chip that opens
   * the full searchable list — omit to show every category inline (the
   * onboarding picker's behavior, unchanged). */
  maxVisible?: number
}

export function CategoryTabs({ categories, selectedId, onSelect, leadingChip, maxVisible }: CategoryTabsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const capped = typeof maxVisible === 'number'
  const pinnedFirst = capped ? categories.slice(0, maxVisible) : categories
  // The category picked from behind "+" might not be one of the pinned
  // ones — pin it too so its active state stays visible instead of looking
  // like nothing is selected.
  const selectedOutsidePinned =
    capped && typeof selectedId === 'number' && !pinnedFirst.some((category) => category.id === selectedId)
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
            className={`${styles.tab} ${selectedId === 'leading' ? styles.tabActive : ''}`}
            onClick={() => onSelect('leading')}
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
          selectedId={typeof selectedId === 'number' ? selectedId : null}
          onSelect={onSelect}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </>
  )
}
