/**
 * 공개 캘린더 데이터 가공(순수 함수). 세션을 서울 날짜 기준 일정으로 바꾸고 달력 격자를 만든다.
 */
import type { Locale } from '@/lib/i18n'
import { formatSessionTime, toKstIso } from '@/lib/format/datetime'
import { categoryHue, categoryLabel, type Hue } from '@/lib/site/labels'
import { sessionLocation, sessionTitle } from '@/lib/site/session-log'
import { sessionPath, localeHref } from '@/lib/site/routes'

/** 캘린더 쿼리가 돌려주는 일정이 있는 공개 세션. */
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
 * 캘린더 일정 하나. 클라이언트로 그대로 넘길 수 있게 현재 언어로 바꾸고 문자열로 평탄화했다.
 * 날짜는 서울 기준(`YYYY-MM-DD`)이다.
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
  /** 공개 세션 페이지 주소. 아직 열리기 전 세션이면 null. */
  href: string | null
}

/** 세션 벽시계 시각의 서울 날짜: `2026-09-24` */
function sessionDay(date: Date): string {
  return toKstIso(date).slice(0, 10)
}

/** 정확히 자정에 끝나는 세션은 전날에 속한다. */
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
 * 세션 목록을 캘린더 일정으로 바꾼다.
 * `visibilityBucket`은 세션 기록·상세 페이지와 같은 공개 기준 시각이라, 상세 페이지가
 * 존재할 때만 일정이 링크로 연결된다.
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
          ? localeHref(locale, sessionPath(session.generationName, session.id))
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

/** 날짜가 속한 달: `2026-09-24` → `2026-09` */
export function monthOfDay(day: string): string {
  return day.slice(0, 7)
}

function utcDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** 달을 앞뒤로 옮긴다: `shiftMonth('2026-12', 1)` → `2027-01` */
export function shiftMonth(month: string, delta: number): string {
  const [year = 1970, index = 1] = month.split('-').map(Number)
  return dayKey(new Date(Date.UTC(year, index - 1 + delta, 1))).slice(0, 7)
}

/** 한 달을 덮는 일요일 시작 주들(4~6줄)의 날짜 키. 앞뒤 달 날짜도 칸을 채운다. */
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

/** `day`에 열리는 일정(여러 날 일정 포함). */
export function eventsOnDay(
  events: readonly CalendarEvent[],
  day: string
): CalendarEvent[] {
  return events.filter((event) => event.startDay <= day && day <= event.endDay)
}

/** `month`와 조금이라도 겹치는 일정. */
export function eventsInMonth(
  events: readonly CalendarEvent[],
  month: string
): CalendarEvent[] {
  return events.filter(
    (event) =>
      monthOfDay(event.startDay) <= month && month <= monthOfDay(event.endDay)
  )
}
