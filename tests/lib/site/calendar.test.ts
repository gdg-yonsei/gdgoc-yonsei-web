import { describe, expect, it } from 'vitest'
import {
  eventsInMonth,
  eventsOnDay,
  monthWeeks,
  shiftMonth,
  toCalendarEvents,
  type CalendarSession,
} from '@/lib/site/calendar'

function session(overrides: Partial<CalendarSession>): CalendarSession {
  return {
    id: 'session-1',
    name: 'Kickoff',
    nameKo: '킥오프',
    category: 'tech_talk',
    startAt: new Date('2026-09-10T19:00:00.000Z'),
    endAt: new Date('2026-09-10T21:00:00.000Z'),
    location: 'Engineering Hall',
    locationKo: '공학관',
    partName: 'Front-End',
    generationName: '6th',
    ...overrides,
  }
}

// Sessions are KST wall-clock values with a UTC label; the bucket is a real
// instant, compared the same way the public session queries compare it.
const bucket = '2026-09-24T03:00:00.000Z'

describe('toCalendarEvents', () => {
  it('links sessions whose public page exists', () => {
    const [event] = toCalendarEvents([session({})], 'ko', bucket)

    expect(event).toMatchObject({
      title: '킥오프',
      categoryLabel: '기술 세션',
      hue: 'blue',
      location: '공학관',
      startDay: '2026-09-10',
      endDay: '2026-09-10',
      startTime: '19:00',
      endTime: '21:00',
      dateTime: '2026-09-10T19:00:00+09:00',
      href: '/ko/session/6th/session-1',
    })
  })

  it('lists scheduled sessions without a link', () => {
    const [upcoming, noEnd] = toCalendarEvents(
      [
        session({
          id: 'upcoming',
          startAt: new Date('2026-10-02T19:00:00.000Z'),
          endAt: new Date('2026-10-02T21:00:00.000Z'),
        }),
        session({
          id: 'no-end',
          startAt: new Date('2026-10-03T19:00:00.000Z'),
          endAt: null,
        }),
      ],
      'en',
      bucket
    )

    expect(upcoming).toMatchObject({ title: 'Kickoff', href: null })
    expect(noEnd).toMatchObject({ endTime: null, href: null })
  })

  it('spans multi-day events, but not into a midnight end', () => {
    const [hackathon, lateNight] = toCalendarEvents(
      [
        session({
          id: 'hackathon',
          startAt: new Date('2026-11-07T10:00:00.000Z'),
          endAt: new Date('2026-11-08T18:00:00.000Z'),
        }),
        session({
          id: 'late',
          startAt: new Date('2026-11-09T22:00:00.000Z'),
          endAt: new Date('2026-11-10T00:00:00.000Z'),
        }),
      ],
      'en',
      bucket
    )

    expect(hackathon).toMatchObject({
      startDay: '2026-11-07',
      endDay: '2026-11-08',
    })
    expect(lateNight).toMatchObject({
      startDay: '2026-11-09',
      endDay: '2026-11-09',
      endTime: '00:00',
    })
  })

  it('keeps evening sessions on their own Seoul day and sorts by start', () => {
    const events = toCalendarEvents(
      [
        session({ id: 'b', startAt: new Date('2026-09-10T23:30:00.000Z') }),
        session({ id: 'a', startAt: new Date('2026-09-10T09:00:00.000Z') }),
      ],
      'en',
      bucket
    )

    expect(events.map((event) => [event.id, event.startDay])).toEqual([
      ['a', '2026-09-10'],
      ['b', '2026-09-10'],
    ])
  })
})

describe('month grid', () => {
  it('shifts across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })

  it('covers the month in Sunday-first weeks', () => {
    const weeks = monthWeeks('2026-09')

    expect(weeks).toHaveLength(5)
    expect(weeks[0]?.[0]).toBe('2026-08-30')
    expect(weeks.at(-1)?.at(-1)).toBe('2026-10-03')
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })

  it('uses six rows only when the month needs them', () => {
    expect(monthWeeks('2026-08')).toHaveLength(6)
    expect(monthWeeks('2026-02')).toHaveLength(4)
  })
})

describe('day and month filters', () => {
  const events = toCalendarEvents(
    [
      session({
        id: 'hackathon',
        startAt: new Date('2026-09-30T10:00:00.000Z'),
        endAt: new Date('2026-10-01T18:00:00.000Z'),
      }),
      session({ id: 'kickoff' }),
    ],
    'en',
    bucket
  )

  it('finds events on each day they run', () => {
    expect(eventsOnDay(events, '2026-10-01').map((e) => e.id)).toEqual([
      'hackathon',
    ])
    expect(eventsOnDay(events, '2026-09-11')).toEqual([])
  })

  it('finds events that overlap a month', () => {
    expect(eventsInMonth(events, '2026-09').map((e) => e.id)).toEqual([
      'kickoff',
      'hackathon',
    ])
    expect(eventsInMonth(events, '2026-10').map((e) => e.id)).toEqual([
      'hackathon',
    ])
  })
})
