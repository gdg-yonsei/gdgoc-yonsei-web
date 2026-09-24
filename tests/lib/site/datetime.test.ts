import { describe, expect, it } from 'vitest'
import {
  formatInstantDate,
  formatLogStamp,
  formatMonthKey,
  formatSessionLongDate,
  formatSessionShortDate,
  formatSessionTime,
  sessionMonthKey,
  toKstIso,
  toSeoulDateIso,
} from '@/lib/site/datetime'

// The admin form stores a 19:00 KST session as 19:00 with a UTC label.
const sixthT19 = new Date('2025-11-04T19:00:00.000Z')

describe('session wall-clock dates', () => {
  it('reads stored session times back as KST wall-clock time', () => {
    expect(formatSessionTime(sixthT19)).toBe('19:00')
    expect(toKstIso(sixthT19)).toBe('2025-11-04T19:00:00+09:00')
  })

  it('keeps evening sessions on their own calendar day', () => {
    // Formatting in Asia/Seoul would move this to November 5.
    expect(formatSessionShortDate(sixthT19, 'en')).toBe('Nov 4, 2025')
    expect(formatSessionShortDate(sixthT19, 'ko')).toBe('2025. 11. 4.')
    expect(formatSessionLongDate(sixthT19, 'en')).toBe(
      'Tuesday, November 4, 2025'
    )
    expect(formatSessionLongDate(sixthT19, 'ko')).toBe('2025년 11월 4일 화요일')
  })

  it('prints log stamps with the weekday', () => {
    expect(formatLogStamp(sixthT19, 'en')).toBe('TUE 2025.11.04 19:00')
    expect(formatLogStamp(sixthT19, 'ko')).toBe('2025.11.04 (화) 19:00')
  })

  it('groups by wall-clock month', () => {
    expect(sessionMonthKey(new Date('2025-11-30T23:30:00.000Z'))).toBe(
      '2025-11'
    )
    expect(formatMonthKey('2025-11', 'en')).toBe('November 2025')
    expect(formatMonthKey('2025-11', 'ko')).toBe('2025년 11월')
  })
})

describe('real instants', () => {
  it('shows createdAt and updatedAt in Seoul time', () => {
    const lateEvening = new Date('2025-11-04T16:30:00.000Z') // 01:30 KST, Nov 5
    expect(formatInstantDate(lateEvening, 'en')).toBe('Nov 5, 2025')
    expect(formatInstantDate(lateEvening, 'ko')).toBe('2025. 11. 5.')
    expect(toSeoulDateIso(lateEvening)).toBe('2025-11-05')
  })
})
