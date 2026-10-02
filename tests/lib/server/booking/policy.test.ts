import { describe, expect, it } from 'vitest'
import {
  checkBookingWindow,
  getMinimumBookingStartDate,
  isTenMinuteBoundary,
  parseBookingDateTime,
} from '@/lib/server/booking/policy'

// 2026-10-01 12:00 KST
const now = new Date('2026-10-01T03:00:00.000Z')

describe('parseBookingDateTime', () => {
  it('reads datetime-local values as Seoul time', () => {
    expect(parseBookingDateTime('2026-10-20T10:00')?.toISOString()).toBe(
      '2026-10-20T01:00:00.000Z'
    )
    expect(parseBookingDateTime('2026-10-20T10:00:30')?.toISOString()).toBe(
      '2026-10-20T01:00:30.000Z'
    )
  })

  it('keeps explicit offsets and rejects garbage', () => {
    expect(parseBookingDateTime('2026-10-20T10:00:00Z')?.toISOString()).toBe(
      '2026-10-20T10:00:00.000Z'
    )
    expect(parseBookingDateTime('not a date')).toBeNull()
    expect(parseBookingDateTime('  ')).toBeNull()
  })
})

describe('getMinimumBookingStartDate', () => {
  it('is Seoul midnight fifteen days ahead', () => {
    expect(getMinimumBookingStartDate(now).toISOString()).toBe(
      '2026-10-15T15:00:00.000Z'
    )
  })
})

describe('isTenMinuteBoundary', () => {
  it('accepts whole ten-minute marks only', () => {
    expect(isTenMinuteBoundary(new Date('2026-10-20T01:10:00Z'))).toBe(true)
    expect(isTenMinuteBoundary(new Date('2026-10-20T01:15:00Z'))).toBe(false)
    expect(isTenMinuteBoundary(new Date('2026-10-20T01:10:01Z'))).toBe(false)
  })
})

describe('checkBookingWindow', () => {
  const at = (value: string) => parseBookingDateTime(value)!

  it('accepts a valid window', () => {
    expect(
      checkBookingWindow(at('2026-10-20T10:00'), at('2026-10-20T12:00'), now)
    ).toBeNull()
  })

  it.each([
    [
      '2026-10-20T12:00',
      '2026-10-20T10:00',
      '종료 시간은 시작 시간 이후여야 합니다',
    ],
    [
      '2026-10-10T10:00',
      '2026-10-10T12:00',
      '예약은 최소 2주 이후 일정만 신청할 수 있습니다',
    ],
    [
      '2026-10-20T10:05',
      '2026-10-20T12:00',
      '예약 시간은 10분 단위로 입력해야 합니다',
    ],
    [
      '2026-10-20T10:00',
      '2026-10-20T10:20',
      '예약 시간은 최소 30분 이상이어야 합니다',
    ],
    [
      '2026-10-20T10:00',
      '2026-10-20T16:10',
      '예약 시간은 최대 6시간까지 신청할 수 있습니다',
    ],
  ])('rejects %s – %s', (start, end, message) => {
    expect(checkBookingWindow(at(start), at(end), now)).toBe(message)
  })
})
