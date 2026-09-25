import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { spring, waapi } from 'animejs'
import { SPRING_SAMPLES, SPRINGS } from '@/lib/motion/springs'

const theme = readFileSync('app/styles/site-theme.css', 'utf8')

/** The token's `linear()` value with all whitespace removed. */
function cssToken(name: string) {
  const match = theme.match(new RegExp(`--${name}:\\s*(linear\\([^;]*\\));`))
  return match?.[1]?.replace(/\s+/g, '')
}

describe('motion springs', () => {
  it.each([
    ['ease-spring', SPRINGS.spring],
    ['ease-spring-snap', SPRINGS.snap],
    ['ease-spring-soft', SPRINGS.soft],
  ] as const)('--%s is the same curve as its anime.js spring', (name, params) => {
    expect(cssToken(name)).toBe(
      waapi
        .convertEase(spring(params).ease, SPRING_SAMPLES)
        .replace(/\s+/g, '')
    )
  })

  it('keeps the house spring a gentle settle and the snap lively', () => {
    const peak = (params: { bounce: number; duration: number }) => {
      const ease = spring(params).ease
      let max = 0
      for (let t = 0; t <= 1; t += 0.01) max = Math.max(max, ease(t))
      return max
    }

    expect(peak(SPRINGS.soft)).toBeLessThanOrEqual(1.001)
    expect(peak(SPRINGS.spring)).toBeGreaterThan(1.005)
    expect(peak(SPRINGS.spring)).toBeLessThan(1.03)
    expect(peak(SPRINGS.snap)).toBeGreaterThan(peak(SPRINGS.spring))
  })
})
