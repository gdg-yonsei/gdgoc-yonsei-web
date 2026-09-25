import { describe, expect, it } from 'vitest'
import { formatCount, parseCount } from '@/lib/motion/count'

describe('count helpers', () => {
  it('reads a printed figure, separators and all', () => {
    expect(parseCount('2,100')).toBe(2100)
    expect(parseCount('6')).toBe(6)
    expect(parseCount('Top')).toBeNull()
  })

  it('prints a figure the way the page does', () => {
    expect(formatCount(2100)).toBe('2,100')
    expect(formatCount(12.6)).toBe('13')
    expect(formatCount(0)).toBe('0')
  })
})
