import { describe, expect, it } from 'vitest'
import { tiltToward } from '@/lib/motion/tilt'

const card = { left: 0, top: 0, width: 400, height: 300 }

describe('tiltToward', () => {
  it('rests flat with the pointer on the centre', () => {
    expect(tiltToward({ x: 200, y: 150 }, card)).toEqual({ x: 0, y: 0 })
  })

  it('turns the near edge away from the pointer, capped', () => {
    // Right edge, bottom edge: the card turns right (rotateY +) and its
    // bottom tips back (rotateX -).
    expect(tiltToward({ x: 400, y: 300 }, card, 4)).toEqual({ x: -4, y: 4 })
    expect(tiltToward({ x: 0, y: 0 }, card, 4)).toEqual({ x: 4, y: -4 })
  })

  it('never exceeds the cap for a pointer outside the card', () => {
    expect(tiltToward({ x: 900, y: -500 }, card, 4)).toEqual({ x: 4, y: 4 })
  })
})
