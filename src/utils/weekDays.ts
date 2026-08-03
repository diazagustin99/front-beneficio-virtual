const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const

export type WeekDay = (typeof WEEK_DAYS)[number]

/** Compact chip label per day — `X` for Miércoles is the conventional
 * Spanish-calendar shorthand, avoiding a clash with Martes' `M`. */
const CHIP_LABELS: Record<WeekDay, string> = {
  Lunes: 'L',
  Martes: 'M',
  Miércoles: 'X',
  Jueves: 'J',
  Viernes: 'V',
  Sábado: 'S',
  Domingo: 'D',
}

export const WEEKDAY_CHIPS: Array<{ day: WeekDay; label: string }> = WEEK_DAYS.map((day) => ({
  day,
  label: CHIP_LABELS[day],
}))

const ABBREVIATION_TO_DAY: Record<string, WeekDay> = {
  Lu: 'Lunes',
  Ma: 'Martes',
  Mi: 'Miércoles',
  Ju: 'Jueves',
  Vi: 'Viernes',
  Sá: 'Sábado',
  Sa: 'Sábado',
  Do: 'Domingo',
}

function normalizeDay(token: string): WeekDay | null {
  const trimmed = token.trim()

  if ((WEEK_DAYS as readonly string[]).includes(trimmed)) {
    return trimmed as WeekDay
  }

  return ABBREVIATION_TO_DAY[trimmed] ?? null
}

/**
 * Scraped `valid_days` data is inconsistent — full names ("Lunes"), a
 * blanket "Todos los días", ranges ("Lunes a Viernes", even week-wrapping
 * ones like "Domingo a Jueves"), and the occasional 2-letter abbreviation.
 * This normalizes all of it into the concrete set of days a promotion is
 * actually valid on, for highlighting day chips.
 */
export function resolveActiveWeekDays(validDays: string[]): Set<WeekDay> {
  const active = new Set<WeekDay>()

  for (const raw of validDays) {
    const entry = raw.trim()

    if (entry === 'Todos los días') {
      WEEK_DAYS.forEach((day) => active.add(day))
      continue
    }

    if (entry.includes(' a ')) {
      const [fromToken, toToken] = entry.split(' a ')
      const from = normalizeDay(fromToken)
      const to = normalizeDay(toToken)

      if (from && to) {
        let index = WEEK_DAYS.indexOf(from)
        const toIndex = WEEK_DAYS.indexOf(to)

        // Wraps around the week (e.g. "Domingo a Jueves") when the end day
        // sorts earlier in the Monday-first list than the start day.
        while (true) {
          active.add(WEEK_DAYS[index])

          if (index === toIndex) {
            break
          }

          index = (index + 1) % WEEK_DAYS.length
        }
      }

      continue
    }

    const day = normalizeDay(entry)

    if (day) {
      active.add(day)
    }
  }

  return active
}
