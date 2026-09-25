import { describe, expect, it } from 'vitest'
import { columnCount, gridShape } from '@/lib/motion/grid'

describe('gridShape', () => {
  // anime.js reads a stagger grid as [columns, rows].
  it('gives the columns and rows of items laid out a number of columns wide', () => {
    expect(gridShape(6, 3)).toEqual([3, 2])
    expect(gridShape(6, 2)).toEqual([2, 3])
    expect(gridShape(6, 1)).toEqual([1, 6])
    expect(gridShape(7, 3)).toEqual([3, 3])
  })

  it('never reports more columns than items, or fewer than one', () => {
    expect(gridShape(2, 3)).toEqual([2, 1])
    expect(gridShape(4, 0)).toEqual([1, 4])
  })
})

describe('columnCount', () => {
  it('counts the items that share the first row', () => {
    expect(columnCount([0, 0, 0, 240, 240, 240])).toBe(3)
    expect(columnCount([0, 0, 180, 180, 360, 360])).toBe(2)
    expect(columnCount([0, 120, 240])).toBe(1)
    expect(columnCount([])).toBe(1)
  })

  it('ignores sub-pixel differences within a row', () => {
    expect(columnCount([10, 10.4, 9.8, 300])).toBe(3)
  })
})
