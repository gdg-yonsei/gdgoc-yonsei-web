import { describe, expect, it } from 'vitest'
import { magnetOffset } from '@/lib/motion/magnet'

const button = { left: 100, top: 100, width: 160, height: 48 }

describe('magnetOffset', () => {
  it('pulls toward a pointer within reach, capped', () => {
    const offset = magnetOffset({ x: 200, y: 124 }, button)
    expect(offset.x).toBeGreaterThan(0)
    expect(offset.y).toBe(0)

    const far = magnetOffset({ x: 320, y: 30 }, button)
    expect(far.x).toBeLessThanOrEqual(10)
    expect(far.y).toBeGreaterThanOrEqual(-10)
  })

  it('lets go of a pointer out of reach', () => {
    expect(magnetOffset({ x: 900, y: 600 }, button)).toEqual({ x: 0, y: 0 })
  })

  it('sits still with the pointer on the centre', () => {
    expect(magnetOffset({ x: 180, y: 124 }, button)).toEqual({ x: 0, y: 0 })
  })
})
