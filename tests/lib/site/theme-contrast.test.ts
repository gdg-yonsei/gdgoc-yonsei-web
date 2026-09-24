import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Chips print a hue's ink on its soft tint; both have to pass WCAG AA.
const theme = readFileSync('app/styles/site-theme.css', 'utf8')
const lightTokens = theme.slice(0, theme.indexOf('@media'))

function token(name: string): string {
  const match = lightTokens.match(
    new RegExp(`--s-${name}:\\s*(#[0-9a-f]{6})`, 'i')
  )
  if (!match?.[1]) throw new Error(`missing --s-${name}`)
  return match[1]
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light! + 0.05) / (dark! + 0.05)
}

describe('site hue tokens', () => {
  it.each(['blue', 'sky', 'red', 'pink', 'yellow', 'green'])(
    '%s ink passes AA on paper and on its soft tint',
    (hue) => {
      const ink = token(`${hue}-ink`)
      expect(contrast(ink, token(`${hue}-soft`))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(ink, token('paper'))).toBeGreaterThanOrEqual(4.5)
    }
  )
})
