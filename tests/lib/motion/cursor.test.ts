import { describe, expect, it } from 'vitest'
import { bandFrame, wordIndexAt } from '@/lib/motion/cursor'

describe('wordIndexAt', () => {
  it('lights nothing before the statement starts crossing', () => {
    expect(wordIndexAt(0, 12)).toBe(-1)
  })

  it('moves one word at a time as the statement crosses', () => {
    expect(wordIndexAt(0.01, 12)).toBe(0)
    expect(wordIndexAt(0.5, 12)).toBe(6)
    expect(wordIndexAt(0.999, 12)).toBe(11)
  })

  it('rests on the last word once the statement has crossed', () => {
    expect(wordIndexAt(1, 12)).toBe(11)
    expect(wordIndexAt(1.4, 12)).toBe(11)
  })
})

describe('bandFrame', () => {
  it('spans the word plus a reach either side, centred on its line', () => {
    expect(
      bandFrame(
        { left: 200, top: 100, width: 120, height: 60 },
        { reach: 12, height: 50 }
      )
    ).toEqual({ x: 188, y: 105, width: 144, height: 50 })
  })
})
