import styles from './WeekdayPicker.module.css'

const WEEKDAYS = [
  { id: 'Lunes', short: 'Lun' },
  { id: 'Martes', short: 'Mar' },
  { id: 'Miércoles', short: 'Mié' },
  { id: 'Jueves', short: 'Jue' },
  { id: 'Viernes', short: 'Vie' },
  { id: 'Sábado', short: 'Sáb' },
  { id: 'Domingo', short: 'Dom' },
]

interface WeekdayPickerProps {
  selectedDays: string[]
  onToggle: (day: string) => void
}

export function WeekdayPicker({ selectedDays, onToggle }: WeekdayPickerProps) {
  return (
    <div className={styles.row}>
      {WEEKDAYS.map((day) => {
        const isSelected = selectedDays.includes(day.id)

        return (
          <button
            key={day.id}
            type="button"
            className={`${styles.day} ${isSelected ? styles.daySelected : ''}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(day.id)}
          >
            {day.short}
          </button>
        )
      })}
    </div>
  )
}
