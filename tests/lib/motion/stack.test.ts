import { describe, expect, it } from 'vitest'
import { stackPhases } from '@/lib/motion/stack'

describe('stackPhases', () => {
  const slots = [104, 128, 152]
  const phases = stackPhases({ slots, height: 380, viewport: 768 })

  it('lands each card as its top travels from the fold to its slot', () => {
    expect(phases.map((phase) => phase.landing)).toEqual([
      { enter: 768, leave: 104 },
      { enter: 768, leave: 128 },
      { enter: 768, leave: 152 },
    ])
  })

  it('recedes a card while the next one slides from its bottom edge to the next slot', () => {
    expect(phases.map((phase) => phase.receding)).toEqual([
      { enter: 484, leave: 128 },
      { enter: 508, leave: 152 },
      null,
    ])
  })

  it('never lets a threshold run backwards on a short screen', () => {
    const short = stackPhases({ slots: [40, 40], height: 700, viewport: 640 })
    expect(short[0]?.landing).toEqual({ enter: 640, leave: 40 })
    expect(short[0]?.receding).toEqual({ enter: 640, leave: 40 })
  })
})
