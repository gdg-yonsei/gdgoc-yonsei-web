import type { Locale } from '@/i18n-config'
import { formatSessionTime, toKstIso } from '@/lib/site/datetime'
import { categoryHue, categoryLabel, type Hue } from '@/lib/site/labels'
import { sessionLocation, sessionTitle } from '@/lib/site/session-log'

/** A dated public session as the calendar read model returns it. */
export type CalendarSession = {
  id: string
  name: string
  nameKo: string
  category: string
  startAt: Date
  endAt: Date | null
  location: string | null
  locationKo: string | null
  partName: string | null
  generationName: string
}

/**
 * One calendar entry, localized and flattened to strings so it crosses to the
 * client as-is. Days are Seoul calendar days (`YYYY-MM-DD`).
 */
export type CalendarEvent = {
  id: string
  title: string
  category: string
  categoryLabel: string
  hue: Hue
  partName: string | null
  location: string | null
  startDay: string
  endDay: string
  startTime: string
  endTime: string | null
  dateTime: string
  /** The public session page, or null while the session is still scheduled. */
  href: string | null
}

/** `2026-09-24`: the Seoul day of a session wall-clock value. */
function sessionDay(date: Date): string {
  return toKstIso(date).slice(0, 10)
}

/** A session ending exactly at midnight belongs to the day before. */
function lastSessionDay(start: Date, end: Date | null): string {
  const startDay = sessionDay(start)
  if (!end || end <= start) return startDay
  const endsAtMidnight = formatSessionTime(end) === '00:00'
  const day = sessionDay(
    endsAtMidnight ? new Date(end.getTime() - 60_000) : end
  )
  return day < startDay ? startDay : day
}

/**
 * `visibilityBucket` is the same publication cut-off the session archive and
 * detail pages use, so an entry links out exactly when its page exists.
 */
export function toCalendarEvents(
  sessions: readonly CalendarSession[],
  locale: Locale,
  visibilityBucket: string
): CalendarEvent[] {
  const publishedBefore = new Date(visibilityBucket).getTime()

  return sessions
    .map((session) => {
      const published =
        session.endAt !== null && session.endAt.getTime() <= publishedBefore

      return {
        id: session.id,
        title: sessionTitle(session, locale),
        category: session.category,
        categoryLabel: categoryLabel(session.category, locale),
        hue: categoryHue(session.category),
        partName: session.partName,
        location: sessionLocation(session, locale),
        startDay: sessionDay(session.startAt),
        endDay: lastSessionDay(session.startAt, session.endAt),
        startTime: formatSessionTime(session.startAt),
        endTime:
          session.endAt && session.endAt > session.startAt
            ? formatSessionTime(session.endAt)
            : null,
        dateTime: toKstIso(session.startAt),
        href: published
          ? `/${locale}/session/${session.generationName}/${session.id}`
          : null,
      }
    })
    .sort(compareEvents)
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  return (
    a.startDay.localeCompare(b.startDay) ||
    a.startTime.localeCompare(b.startTime) ||
    a.title.localeCompare(b.title)
  )
}

/** `2026-09` */
export function monthOfDay(day: string): string {
  return day.slice(0, 7)
}

function utcDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** `2026-09` shifted by whole months: `shiftMonth('2026-12', 1)` → `2027-01`. */
export function shiftMonth(month: string, delta: number): string {
  const [year = 1970, index = 1] = month.split('-').map(Number)
  return dayKey(new Date(Date.UTC(year, index - 1 + delta, 1))).slice(0, 7)
}

/** The Sunday-first weeks that cover a month, as day keys (4 to 6 rows). */
export function monthWeeks(month: string): string[][] {
  const first = utcDay(`${month}-01`)
  const cursor = new Date(first)
  cursor.setUTCDate(1 - first.getUTCDay())

  const weeks: string[][] = []
  do {
    const week: string[] = []
    for (let weekday = 0; weekday < 7; weekday += 1) {
      week.push(dayKey(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(week)
  } while (monthOfDay(dayKey(cursor)) === month)

  return weeks
}

/** Events that take place on `day`, multi-day events included. */
export function eventsOnDay(
  events: readonly CalendarEvent[],
  day: string
): CalendarEvent[] {
  return events.filter((event) => event.startDay <= day && day <= event.endDay)
}

/** Events that overlap `month` at all. */
export function eventsInMonth(
  events: readonly CalendarEvent[],
  month: string
): CalendarEvent[] {
  return events.filter(
    (event) =>
      monthOfDay(event.startDay) <= month && month <= monthOfDay(event.endDay)
  )
}
