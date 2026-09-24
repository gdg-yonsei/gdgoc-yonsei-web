import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CAPSULE_HEX, hexToUnitRgb } from '@/lib/site/brand'

describe('capsule colours', () => {
  it('converts hex to the unit RGB WebGL uniforms take', () => {
    expect(hexToUnitRgb('#EA4335')).toEqual([0.918, 0.263, 0.208])
    expect(hexToUnitRgb('#34A853')).toEqual([0.204, 0.659, 0.325])
  })

  it('matches the GDG palette tokens in the theme', () => {
    const theme = readFileSync(
      'app/styles/site-theme.css',
      'utf8'
    ).toLowerCase()
    for (const [hue, hex] of Object.entries(CAPSULE_HEX)) {
      expect(theme).toContain(`--color-g-${hue}: ${hex.toLowerCase()};`)
    }
  })
})
