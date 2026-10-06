import type { CapsuleHue } from '@/lib/site/bracket-geometry'

// GDG 로고 캡슐 색: 빨강·파랑은 <, 초록·노랑은 >. SVG·WebGL·404·소셜 카드가 공유한다.
export const CAPSULE_HEX: Readonly<Record<CapsuleHue, string>> = {
  red: '#EA4335',
  blue: '#4285F4',
  yellow: '#F9AB00',
  green: '#34A853',
}

export function hexToUnitRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  const unit = (channel: number) => Math.round((channel / 255) * 1000) / 1000
  return [
    unit((value >> 16) & 255),
    unit((value >> 8) & 255),
    unit(value & 255),
  ]
}
