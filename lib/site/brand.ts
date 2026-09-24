import type { CapsuleHue } from '@/lib/site/bracket-geometry'

/**
 * The four GDG capsule colours as the logo draws them (red + blue = "<",
 * green + yellow = ">"). The one source for the SVG poster, the WebGL field,
 * the proxy's inline 404 page and the social cards.
 */
export const CAPSULE_HEX: Readonly<Record<CapsuleHue, string>> = {
  red: '#EA4335',
  blue: '#4285F4',
  yellow: '#F9AB00',
  green: '#34A853',
}

/** `#EA4335` → `[0.918, 0.263, 0.208]`, rounded to three places. */
export function hexToUnitRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  const unit = (channel: number) => Math.round((channel / 255) * 1000) / 1000
  return [
    unit((value >> 16) & 255),
    unit((value >> 8) & 255),
    unit(value & 255),
  ]
}
