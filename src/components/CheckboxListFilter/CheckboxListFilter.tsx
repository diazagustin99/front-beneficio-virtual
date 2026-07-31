import type { UIEvent } from 'react'
import styles from './CheckboxListFilter.module.css'

export interface CheckboxOption {
  id: string | number
  label: string
}

interface CheckboxListFilterProps {
  options: CheckboxOption[]
  selectedIds: Array<string | number>
  onToggle: (id: string | number) => void
  searchValue?: string
  onSearchChange?: (text: string) => void
  searchPlaceholder?: string
  onListScroll?: (event: UIEvent<HTMLUListElement>) => void
  isLoadingMore?: boolean
  emptyMessage?: string
}

export function CheckboxListFilter({
  options,
  selectedIds,
  onToggle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onListScroll,
  isLoadingMore,
  emptyMessage,
}: CheckboxListFilterProps) {
  return (
    <div className={styles.field}>
      {onSearchChange && (
        <input
          type="text"
          className={styles.search}
          placeholder={searchPlaceholder ?? 'Buscar...'}
          value={searchValue ?? ''}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      )}

      {options.length === 0 && emptyMessage ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list} onScroll={onListScroll}>
          {options.map((option) => (
            <li key={option.id}>
              <label className={styles.option}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => onToggle(option.id)}
                />
                {option.label}
              </label>
            </li>
          ))}
          {isLoadingMore && <li className={styles.loadingMore}>Cargando más...</li>}
        </ul>
      )}
    </div>
  )
}
