import { describe, expect, it } from 'vitest'
import { dateRegex } from '@/lib/yyyy-mm-dd-regex'

describe('dateRegex', () => {
  it('matches YYYY-MM-DD shaped values', () => {
    expect(dateRegex.test('2025-12-31')).toBe(true)
  })

  it('rejects invalid shaped values', () => {
    expect(dateRegex.test('25-12-31')).toBe(false)
    expect(dateRegex.test('2025/12/31')).toBe(false)
    expect(dateRegex.test('20251231')).toBe(false)
  })
})
