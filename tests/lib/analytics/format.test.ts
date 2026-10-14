import { describe, expect, it } from 'vitest'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
  formatSignedPercent,
  formatVital,
} from '@/app/(admin)/admin/analytics/_lib/format'

describe('analytics formatting', () => {
  it('compacts large numbers and formats rates', () => {
    expect(formatNumber(1284, 'en')).toBe('1,284')
    expect(formatNumber(12_900, 'en')).toBe('12.9K')
    expect(formatPercent(0.4567, 'en')).toBe('45.7%')
    expect(formatSignedPercent(0.123, 'en')).toBe('+12.3%')
    expect(formatSignedPercent(-0.05, 'en')).toBe('-5.0%')
    expect(formatSignedPercent(null, 'en')).toBeNull()
  })

  it('formats durations, buckets and vitals', () => {
    expect(formatDuration(42.4)).toBe('42s')
    expect(formatDuration(65)).toBe('1m 05s')
    expect(formatBucketLabel('2026-10-14', 'en')).toBe('Oct 14')
    expect(formatBucketLabel('2026-10-14T09', 'ko')).toBe('09시')
    expect(formatVital('LCP', 2345)).toBe('2.35 s')
    expect(formatVital('INP', 180)).toBe('180 ms')
    expect(formatVital('CLS', 0.0512)).toBe('0.05')
    expect(formatVital('LCP', null)).toBe('—')
  })
})
