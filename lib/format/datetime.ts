// 세션은 서울 벽시계 시각을 UTC 라벨로 저장한다(19:00Z는 서울 19:00). UTC로 읽고 +09:00을 붙인다.
// createdAt/updatedAt은 실제 시각이므로 Asia/Seoul로 표시한다.
import type { Locale } from '@/lib/i18n'

/** 서울 시간대 오프셋(+9시간). 서울은 서머타임이 없다. */
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

// 세션의 UTC 라벨 벽시계와 비교하려면 실제 현재 시각에 서울 오프셋(+9시간)을 더해야 한다.
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

const INSTANT_DATE_TIME: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }),
  ko: new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
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

/** `2025-11-04T19:00:00+09:00`. `<time dateTime>`과 JSON-LD에 쓴다. */
export function toKstIso(date: Date): string {
  const t = wallClock(date)
  return `${t.year}-${t.month}-${t.day}T${t.time}:00+09:00`
}

/** 세션 시각(서울 벽시계): `19:00` */
export function formatSessionTime(date: Date): string {
  return wallClock(date).time
}

/** 세션 기록의 일시 표기: `TUE 2025.11.04 19:00` / `2025.11.04 (화) 19:00` */
export function formatLogStamp(date: Date, locale: Locale): string {
  const t = wallClock(date)
  const day = `${t.year}.${t.month}.${t.day}`
  const weekday = WEEKDAYS[locale][t.weekday] ?? ''
  return locale === 'ko'
    ? `${day} (${weekday}) ${t.time}`
    : `${weekday} ${day} ${t.time}`
}

/** 세션 날짜(긴 형식): `Tuesday, November 4, 2025` / `2025년 11월 4일 화요일` */
export function formatSessionLongDate(date: Date, locale: Locale): string {
  return SESSION_LONG[locale].format(date)
}

/** 세션 날짜(짧은 형식): `Nov 4, 2025` / `2025. 11. 4.` */
export function formatSessionShortDate(date: Date, locale: Locale): string {
  return SESSION_SHORT[locale].format(date)
}

export function sessionMonthKey(date: Date): string {
  const t = wallClock(date)
  return `${t.year}-${t.month}`
}

/** `YYYY-MM` 키를 `November 2025` / `2025년 11월`로 표시한다. */
export function formatMonthKey(key: string, locale: Locale): string {
  const [year = 1970, month = 1] = key.split('-').map(Number)
  return MONTH[locale].format(new Date(Date.UTC(year, month - 1, 1)))
}

/** 실제 시각을 서울 기준 날짜로: `Nov 5, 2025` / `2025. 11. 5.` */
export function formatInstantDate(date: Date, locale: Locale): string {
  return INSTANT[locale].format(date)
}

/** 실제 시각을 서울 기준 날짜와 시각으로: `Nov 5, 2025, 7:03 PM` / `2025. 11. 5. 오후 7:03` */
export function formatInstantDateTime(date: Date, locale: Locale): string {
  return INSTANT_DATE_TIME[locale].format(date)
}

/** `2025-11-05`: 실제 시각의 서울 기준 날짜. */
export function toSeoulDateIso(date: Date): string {
  return SEOUL_ISO_DATE.format(date)
}
