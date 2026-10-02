import { describe, expect, it } from 'vitest'
import {
  buildSessionPlans,
  SEED_WINDOW,
  weeklyOccurrences,
} from '../../scripts/seed/helpers'

describe('weeklyOccurrences', () => {
  it('generates weekly dates on the requested weekday and wall-clock hour', () => {
    const dates = weeklyOccurrences({
      from: new Date('2025-09-01T00:00:00.000Z'),
      to: new Date('2025-09-30T23:59:59.000Z'),
      weekday: 2,
      hour: 10,
    })
    expect(dates.map((date) => date.toISOString())).toEqual([
      '2025-09-02T10:00:00.000Z',
      '2025-09-09T10:00:00.000Z',
      '2025-09-16T10:00:00.000Z',
      '2025-09-23T10:00:00.000Z',
      '2025-09-30T10:00:00.000Z',
    ])
  })

  it('skips dates inside skip ranges', () => {
    const dates = weeklyOccurrences({
      from: new Date('2025-09-01T00:00:00.000Z'),
      to: new Date('2025-09-30T23:59:59.000Z'),
      weekday: 2,
      hour: 10,
      skipRanges: [
        {
          from: new Date('2025-09-08T00:00:00.000Z'),
          to: new Date('2025-09-14T23:59:59.000Z'),
        },
      ],
    })
    expect(dates.map((date) => date.toISOString())).not.toContain(
      '2025-09-09T10:00:00.000Z'
    )
    expect(dates).toHaveLength(4)
  })

  it('supports biweekly steps', () => {
    const dates = weeklyOccurrences({
      from: new Date('2025-09-01T00:00:00.000Z'),
      to: new Date('2025-09-30T23:59:59.000Z'),
      weekday: 2,
      hour: 10,
      stepWeeks: 2,
    })
    expect(dates.map((date) => date.toISOString())).toEqual([
      '2025-09-02T10:00:00.000Z',
      '2025-09-16T10:00:00.000Z',
      '2025-09-30T10:00:00.000Z',
    ])
  })
})

describe('buildSessionPlans', () => {
  it('produces a realistic year of activities covering all five categories', () => {
    const plans = buildSessionPlans()
    expect(plans.length).toBeGreaterThanOrEqual(40)
    expect(new Set(plans.map((plan) => plan.category))).toEqual(
      new Set(['tech_talk', 'part_session', 'hackathon', 'demo_day', 'devrel'])
    )
    expect(plans.every((plan) => plan.endAt > plan.startAt)).toBe(true)
    expect(plans.every((plan) => plan.startAt >= SEED_WINDOW.from)).toBe(true)
  })

  it('stores times as Seoul wall clock under a UTC label, like real sessions', () => {
    const plans = buildSessionPlans()
    const t19 = plans.filter((plan) => plan.category === 'tech_talk')
    expect(t19.length).toBeGreaterThan(0)
    // T19는 "Tech at 19:00": 서울 19시가 UTC 라벨 19시로 저장되어야 화면에 19:00으로 보인다.
    expect(t19.every((plan) => plan.startAt.getUTCHours() === 19)).toBe(true)
    expect(plans.every((plan) => plan.startAt.getUTCHours() >= 9)).toBe(true)
  })
})
