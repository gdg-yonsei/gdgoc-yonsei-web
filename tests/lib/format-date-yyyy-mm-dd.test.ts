import { describe, expect, it } from 'vitest'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'

describe('formatDateYYYYMMDD', () => {
  it('returns YYYY.MM.DD format for a date', () => {
    const result = formatDateYYYYMMDD(new Date(2025, 0, 2, 12, 0, 0))

    expect(result).toMatch(/^2025\.\s?01\.\s?02\.$/)
  })
})
