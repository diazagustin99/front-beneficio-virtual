import { resolveActiveWeekDays, WEEKDAY_CHIPS } from '../../utils/weekDays'
import styles from './WeekdayChips.module.css'

interface WeekdayChipsProps {
  validDays: string[]
}

/** One chip per day of the week — highlighted for the days a promotion is
 * actually valid on, muted for the rest. */
export function WeekdayChips({ validDays }: WeekdayChipsProps) {
  if (validDays.length === 0) {
    return null
  }

  const activeDays = resolveActiveWeekDays(validDays)

  return (
    <div className={styles.chips} role="list" aria-label="Días válidos">
      {WEEKDAY_CHIPS.map(({ day, label }) => {
        const isActive = activeDays.has(day)

        return (
          <span
            key={day}
            role="listitem"
            className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
            aria-label={day}
            aria-current={isActive}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}
