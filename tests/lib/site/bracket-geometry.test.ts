import { describe, expect, it } from 'vitest'
import {
  BRACKET,
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  capsulesFromBracketRects,
  partingOffset,
  scrollProgress,
} from '@/lib/site/bracket-geometry'

describe('bracket geometry', () => {
  it('sizes a single bracket view box from the logo capsule measurements', () => {
    expect(BRACKET_VIEWBOX.width).toBeCloseTo(
      BRACKET.armDx + BRACKET.radius * 2
    )
    expect(BRACKET_VIEWBOX.height).toBeCloseTo(
      BRACKET.armDy * 2 + BRACKET.radius * 2
    )
  })

  it('draws `<` as red over blue meeting at a left apex', () => {
    const [red, blue] = bracketCapsulesInViewBox('left')
    expect(red).toMatchObject({ hue: 'red', ax: 52.78, bx: 166.38 })
    expect(red!.ay).toBeCloseTo(132.98)
    expect(red!.by).toBeCloseTo(52.78)
    expect(blue).toMatchObject({ hue: 'blue', ax: 52.78, bx: 166.38 })
    expect(blue!.by).toBeCloseTo(213.18)
  })

  it('draws `>` as yellow then green meeting at a right apex', () => {
    const [yellow, green] = bracketCapsulesInViewBox('right')
    expect(yellow).toMatchObject({ hue: 'yellow', ax: 52.78, bx: 166.38 })
    expect(yellow!.ay).toBeCloseTo(213.18)
    expect(green).toMatchObject({ hue: 'green' })
    expect(green!.ay).toBeCloseTo(52.78)
    expect(green!.by).toBeCloseTo(132.98)
  })

  it('writes a stadium path whose caps bulge away from the body', () => {
    expect(capsulePath({ hue: 'red', ax: 0, ay: 0, bx: 10, by: 0, r: 2 })).toBe(
      'M0 2L10 2A2 2 0 0 0 10 -2L0 -2A2 2 0 0 0 0 2Z'
    )
  })

  it('maps rendered bracket boxes into canvas space and parts them', () => {
    const left = { left: 0, top: 0, width: 219.16, height: 265.96 }
    const right = { left: 400, top: 0, width: 219.16, height: 265.96 }
    const capsules = capsulesFromBracketRects(left, right)
    expect(capsules.map((capsule) => capsule.hue)).toEqual([
      'red',
      'blue',
      'yellow',
      'green',
    ])
    expect(capsules[0]!.ax).toBeCloseTo(52.78)
    expect(capsules[3]!.bx).toBeCloseTo(566.38)

    const doubled = capsulesFromBracketRects(
      { ...left, height: 531.92 },
      { ...right, height: 531.92 }
    )
    expect(doubled[0]!.r).toBeCloseTo(105.56)

    const parted = capsulesFromBracketRects(left, right, 10)
    expect(parted[0]!.ax).toBeCloseTo(42.78)
    expect(parted[3]!.bx).toBeCloseTo(576.38)
  })

  it('clamps scroll progress and eases the parting distance', () => {
    expect(scrollProgress(-20, 800)).toBe(0)
    expect(scrollProgress(400, 800)).toBe(0.5)
    expect(scrollProgress(1200, 800)).toBe(1)
    expect(scrollProgress(100, 0)).toBe(0)
    expect(partingOffset(0, 1000)).toBe(0)
    expect(partingOffset(0.5, 1000)).toBeCloseTo(275)
    expect(partingOffset(1, 1000)).toBeCloseTo(550)
  })
})
