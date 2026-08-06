import { describe, expect, it } from 'vitest'
import {
  buildSessionPlans,
  SEED_WINDOW,
  weeklyOccurrences,
} from '../../scripts/seed/helpers'

describe('weeklyOccurrences', () => {
  it('generates weekly dates on the requested UTC weekday', () => {
    const dates = weeklyOccurrences({
      from: new Date('2025-09-01T00:00:00.000Z'),
      to: new Date('2025-09-30T23:59:59.000Z'),
      weekday: 2,
      hourUtc: 10,
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
      hourUtc: 10,
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
      hourUtc: 10,
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
})
