import { DAY_FILTER_CHIPS, type WeekDay } from '../../utils/weekDays'
import styles from './DayFilterChips.module.css'

/** `null` means "Todos". */
export type DayFilterSelection = WeekDay | null

interface DayFilterChipsProps {
  selected: DayFilterSelection
  onSelect: (day: DayFilterSelection) => void
}

/** Rounded-square chip row to filter a promotion list by day — "Todos"
 * (default) plus one chip per day of the week, single-select. */
export function DayFilterChips({ selected, onSelect }: DayFilterChipsProps) {
  return (
    <div className={styles.chips} role="group" aria-label="Filtrar por día">
      <button
        type="button"
        className={`${styles.chip} ${selected === null ? styles.chipActive : ''}`}
        onClick={() => onSelect(null)}
      >
        Todos
      </button>
      {DAY_FILTER_CHIPS.map(({ day, label }) => (
        <button
          key={day}
          type="button"
          className={`${styles.chip} ${selected === day ? styles.chipActive : ''}`}
          aria-pressed={selected === day}
          onClick={() => onSelect(day)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
