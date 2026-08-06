import { describe, expect, it } from 'vitest'
import {
  buildHeatmapWeeks,
  dominantCategoryOf,
  HEATMAP_WEEKS,
  intensityOpacity,
  startOfWeekUtc,
  type HeatmapSessionInput,
} from '@/lib/heatmap'

function makeSession(
  overrides: Partial<HeatmapSessionInput>
): HeatmapSessionInput {
  return {
    id: 's-1',
    name: 'Session',
    nameKo: '세션',
    startAt: '2026-07-07T10:00:00.000Z',
    category: 'tech_talk',
    participantCount: 10,
    ...overrides,
  }
}

const REFERENCE = new Date('2026-07-11T09:00:00.000Z') // 토요일

describe('startOfWeekUtc', () => {
  it('returns Monday 00:00 UTC for a mid-week date', () => {
    expect(
      startOfWeekUtc(new Date('2026-07-11T09:00:00.000Z')).toISOString()
    ).toBe('2026-07-06T00:00:00.000Z')
  })

  it('keeps Monday in its own week and Sunday in the previous week', () => {
    expect(
      startOfWeekUtc(new Date('2026-07-06T00:00:00.000Z')).toISOString()
    ).toBe('2026-07-06T00:00:00.000Z')
    expect(
      startOfWeekUtc(new Date('2026-07-05T23:59:59.000Z')).toISOString()
    ).toBe('2026-06-29T00:00:00.000Z')
  })
})

describe('buildHeatmapWeeks', () => {
  it('always returns 52 weeks, oldest first, ending at the reference week', () => {
    const weeks = buildHeatmapWeeks([], REFERENCE)
    expect(weeks).toHaveLength(HEATMAP_WEEKS)
    expect(weeks[51]!.weekKey).toBe('2026-07-06')
    expect(weeks[0]!.weekKey).toBe('2025-07-14')
    expect(
      weeks.every((week) => week.count === 0 && week.dominantCategory === null)
    ).toBe(true)
  })

  it('buckets sessions into their UTC week', () => {
    const weeks = buildHeatmapWeeks(
      [
        makeSession({ id: 'a', startAt: '2026-07-06T00:00:00.000Z' }),
        makeSession({ id: 'b', startAt: '2026-07-05T23:00:00.000Z' }),
      ],
      REFERENCE
    )
    expect(weeks[51]!.sessions.map((session) => session.id)).toEqual(['a'])
    expect(weeks[50]!.sessions.map((session) => session.id)).toEqual(['b'])
  })

  it('ignores sessions outside the 52-week window', () => {
    const weeks = buildHeatmapWeeks(
      [makeSession({ startAt: '2024-01-01T00:00:00.000Z' })],
      REFERENCE
    )
    expect(weeks.reduce((sum, week) => sum + week.count, 0)).toBe(0)
  })
})

describe('dominantCategoryOf', () => {
  it('picks the majority category', () => {
    expect(
      dominantCategoryOf([
        makeSession({ category: 'devrel' }),
        makeSession({ category: 'devrel' }),
        makeSession({ category: 'hackathon' }),
      ])
    ).toBe('devrel')
  })

  it('breaks ties by priority (hackathon > demo_day > tech_talk > part_session > devrel)', () => {
    expect(
      dominantCategoryOf([
        makeSession({ category: 'devrel' }),
        makeSession({ category: 'demo_day' }),
      ])
    ).toBe('demo_day')
  })

  it('returns null for an empty week', () => {
    expect(dominantCategoryOf([])).toBe(null)
  })
})

describe('intensityOpacity', () => {
  it('maps counts to 0.45 / 0.7 / 1.0 steps', () => {
    expect(intensityOpacity(1)).toBe(0.45)
    expect(intensityOpacity(2)).toBe(0.7)
    expect(intensityOpacity(3)).toBe(1)
    expect(intensityOpacity(9)).toBe(1)
  })
})
