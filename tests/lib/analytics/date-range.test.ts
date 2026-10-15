import { describe, expect, it } from 'vitest'
import {
  bucketKeys,
  resolveDateRange,
  seoulDateString,
} from '@/lib/analytics/date-range'

// 서울 2026-10-14 14:00 = UTC 05:00
const NOW = new Date('2026-10-14T05:00:00.000Z')

describe('resolveDateRange', () => {
  it('uses Seoul day boundaries for today', () => {
    const range = resolveDateRange(
      { range: 'today', from: null, to: null },
      NOW
    )
    expect(range.start.toISOString()).toBe('2026-10-13T15:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-10-14T15:00:00.000Z')
    expect(range.previousStart.toISOString()).toBe('2026-10-12T15:00:00.000Z')
    expect(range).toMatchObject({ bucket: 'hour', days: 1 })
  })

  it('covers the 28 full days before today with the previous 28 days before it', () => {
    const range = resolveDateRange({ range: '28d', from: null, to: null }, NOW)
    expect(range.start.toISOString()).toBe('2026-09-15T15:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-10-13T15:00:00.000Z')
    expect(range.previousEnd.toISOString()).toBe(range.start.toISOString())
    expect(range.previousStart.toISOString()).toBe('2026-08-18T15:00:00.000Z')
    expect(range).toMatchObject({ bucket: 'day', days: 28 })
  })

  it('switches to weekly buckets for 12 months', () => {
    expect(
      resolveDateRange({ range: '12m', from: null, to: null }, NOW)
    ).toMatchObject({
      bucket: 'week',
      days: 365,
    })
  })

  it('reads an inclusive custom range, swaps reversed dates and clamps to 26 months', () => {
    const range = resolveDateRange(
      { range: 'custom', from: '2026-09-30', to: '2026-09-01' },
      NOW
    )
    expect(range.start.toISOString()).toBe('2026-08-31T15:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-09-30T15:00:00.000Z')
    expect(range.days).toBe(30)

    const clamped = resolveDateRange(
      { range: 'custom', from: '2020-01-01', to: '2026-10-14' },
      NOW
    )
    expect(seoulDateString(clamped.start)).toBe('2024-08-14')
  })

  it('falls back to 28 days when a custom range is incomplete', () => {
    expect(
      resolveDateRange({ range: 'custom', from: null, to: null }, NOW).days
    ).toBe(28)
  })
})

describe('bucketKeys', () => {
  it('lists Seoul days, hours and Monday weeks', () => {
    const range = resolveDateRange({ range: '7d', from: null, to: null }, NOW)
    expect(bucketKeys(range.start, range.end, 'day')).toEqual([
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
    ])
    const today = resolveDateRange(
      { range: 'today', from: null, to: null },
      NOW
    )
    const hours = bucketKeys(today.start, today.end, 'hour')
    expect(hours).toHaveLength(24)
    expect(hours[0]).toBe('2026-10-14T00')
    expect(bucketKeys(range.start, range.end, 'week')).toEqual([
      '2026-10-05',
      '2026-10-12',
    ])
  })
})
