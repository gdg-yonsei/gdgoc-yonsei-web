import type { Locale } from '@/i18n-config'

/*
 * Two kinds of timestamps reach the public pages:
 *
 * - Session start/end times are KST wall-clock values stored with a UTC
 *   label: the admin form parses a `datetime-local` value on a UTC server and
 *   the edit form reads it back with `toISOString().slice(0, 16)`. Read them
 *   in UTC and label them +09:00 (`19:00Z` in the DB is 19:00 in Seoul).
 * - createdAt / updatedAt are real instants (defaultNow); show them in
 *   Asia/Seoul.
 */

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * Session start/end are KST wall-clock values stored under a UTC label
 * (`19:00Z` in the DB means 19:00 in Seoul). To compare them against "now",
 * use Seoul's wall clock expressed in UTC — `Date.now() + 9h` — not the real
 * instant. Returns a `Date` whose UTC fields equal current Seoul wall time.
 */
export function sessionWallClockNow(from: Date = new Date()): Date {
  return new Date(from.getTime() + SEOUL_OFFSET_MS)
}

const WEEKDAYS: Record<Locale, readonly string[]> = {
  en: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  ko: ['일', '월', '화', '수', '목', '금', '토'],
}

const pad = (value: number) => String(value).padStart(2, '0')

function wallClock(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: pad(date.getUTCMonth() + 1),
    day: pad(date.getUTCDate()),
    weekday: date.getUTCDay(),
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
  }
}

const SESSION_LONG: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }),
}

const SESSION_SHORT: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }),
}

const MONTH: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }),
}

const INSTANT: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }),
}

const SEOUL_ISO_DATE = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
})

/** `2025-11-04T19:00:00+09:00`, for `<time dateTime>` and JSON-LD. */
export function toKstIso(date: Date): string {
  const t = wallClock(date)
  return `${t.year}-${t.month}-${t.day}T${t.time}:00+09:00`
}

/** `19:00` */
export function formatSessionTime(date: Date): string {
  return wallClock(date).time
}

/** `TUE 2025.11.04 19:00` / `2025.11.04 (화) 19:00` */
export function formatLogStamp(date: Date, locale: Locale): string {
  const t = wallClock(date)
  const day = `${t.year}.${t.month}.${t.day}`
  const weekday = WEEKDAYS[locale][t.weekday] ?? ''
  return locale === 'ko'
    ? `${day} (${weekday}) ${t.time}`
    : `${weekday} ${day} ${t.time}`
}

/** `Tuesday, November 4, 2025` / `2025년 11월 4일 화요일` */
export function formatSessionLongDate(date: Date, locale: Locale): string {
  return SESSION_LONG[locale].format(date)
}

/** `Nov 4, 2025` / `2025. 11. 4.` */
export function formatSessionShortDate(date: Date, locale: Locale): string {
  return SESSION_SHORT[locale].format(date)
}

/** `2025-11`, the key the log groups by. */
export function sessionMonthKey(date: Date): string {
  const t = wallClock(date)
  return `${t.year}-${t.month}`
}

/** `November 2025` / `2025년 11월` for a `YYYY-MM` key. */
export function formatMonthKey(key: string, locale: Locale): string {
  const [year = 1970, month = 1] = key.split('-').map(Number)
  return MONTH[locale].format(new Date(Date.UTC(year, month - 1, 1)))
}

/** Real instants in Seoul: `Nov 5, 2025` / `2025. 11. 5.` */
export function formatInstantDate(date: Date, locale: Locale): string {
  return INSTANT[locale].format(date)
}

/** `2025-11-05`: the Seoul calendar day of a real instant. */
export function toSeoulDateIso(date: Date): string {
  return SEOUL_ISO_DATE.format(date)
}
