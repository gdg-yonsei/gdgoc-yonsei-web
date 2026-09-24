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

const darkTokens = theme.slice(
  theme.indexOf('@media (prefers-color-scheme: dark)')
)

function darkToken(name: string): string {
  const match = darkTokens.match(
    new RegExp(`--s-${name}:\\s*(#[0-9a-f]{6})`, 'i')
  )
  if (!match?.[1]) throw new Error(`missing dark --s-${name}`)
  return match[1]
}

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

function hexToLinear(hex: string): [number, number, number] {
  return [1, 3, 5].map((index) =>
    toLinear(parseInt(hex.slice(index, index + 2), 16) / 255)
  ) as [number, number, number]
}

function linearToOklab([r, g, b]: [number, number, number]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToLinear([L, a, b]: number[]): [number, number, number] {
  const l = (L! + 0.3963377774 * a! + 0.2158037573 * b!) ** 3
  const m = (L! - 0.1055613458 * a! - 0.0638541728 * b!) ** 3
  const s = (L! - 0.0894841775 * a! - 1.291485548 * b!) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const linearLuminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * Math.min(1, Math.max(0, r)) +
  0.7152 * Math.min(1, Math.max(0, g)) +
  0.0722 * Math.min(1, Math.max(0, b))

/** Luminance of `color-mix(in oklab, <hue> <p>%, <base>)`. */
function mixedLuminance(hue: string, percent: number, base: string) {
  const a = linearToOklab(hexToLinear(hue))
  const b = linearToOklab(hexToLinear(base))
  const p = percent / 100
  return linearLuminance(
    oklabToLinear(a.map((value, index) => value * p + b[index]! * (1 - p)))
  )
}

describe('dark scheme hue tokens', () => {
  it.each(['blue', 'sky', 'red', 'pink', 'yellow', 'green'])(
    '%s ink passes AA on dark paper and on its dark tint',
    (hue) => {
      const mix = darkTokens.match(
        new RegExp(
          `--s-${hue}-soft: color-mix\\(in oklab, (#[0-9a-f]{6}) (\\d+)%, (#[0-9a-f]{6})\\)`,
          'i'
        )
      )
      if (!mix) throw new Error(`missing dark --s-${hue}-soft`)
      const ink = linearLuminance(hexToLinear(darkToken(`${hue}-ink`)))
      const tint = mixedLuminance(mix[1]!, Number(mix[2]), mix[3]!)
      const paper = linearLuminance(hexToLinear(darkToken('paper')))
      const ratio = (x: number, y: number) =>
        (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)

      expect(ratio(ink, tint)).toBeGreaterThanOrEqual(4.5)
      expect(ratio(ink, paper)).toBeGreaterThanOrEqual(4.5)
    }
  )
})
