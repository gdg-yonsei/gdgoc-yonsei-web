import { describe, expect, it } from 'vitest'
import { fieldShape, nearestCell } from '@/lib/motion/field'

const stage = { left: 0, top: 100, width: 1000, height: 400 }

describe('nearestCell', () => {
  it('finds the dot under a point on an evenly spread grid, row by row', () => {
    // 10 columns × 4 rows: cells are 100 × 100, dots at their centres.
    expect(nearestCell({ x: 50, y: 150 }, stage, 10, 4)).toBe(0)
    expect(nearestCell({ x: 950, y: 150 }, stage, 10, 4)).toBe(9)
    expect(nearestCell({ x: 420, y: 330 }, stage, 10, 4)).toBe(24)
  })

  it('clamps points outside the stage to its edge cells', () => {
    expect(nearestCell({ x: -40, y: 900 }, stage, 10, 4)).toBe(30)
  })
})

describe('fieldShape', () => {
  it('spreads dots about every spacing pixels, within a cap', () => {
    expect(fieldShape(1000, 400, 40, 400)).toEqual([25, 10])
    const [columns, rows] = fieldShape(4000, 1600, 40, 400)
    expect(columns * rows).toBeLessThanOrEqual(400)
  })

  it('keeps at least one dot each way on a tiny stage', () => {
    expect(fieldShape(10, 10, 40, 400)).toEqual([1, 1])
  })
})
