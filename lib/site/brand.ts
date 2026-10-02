/**
 * GDG 브랜드 색 상수.
 */
import type { CapsuleHue } from '@/lib/site/bracket-geometry'

/**
 * 로고의 GDG 캡슐 4색(빨강 + 파랑 = "<", 초록 + 노랑 = ">"). SVG 포스터, WebGL 배경,
 * proxy의 인라인 404 페이지, 소셜 카드가 모두 이 값을 쓴다.
 */
export const CAPSULE_HEX: Readonly<Record<CapsuleHue, string>> = {
  red: '#EA4335',
  blue: '#4285F4',
  yellow: '#F9AB00',
  green: '#34A853',
}

/** 16진 색을 0~1 RGB(소수 셋째 자리 반올림)로 바꾼다(WebGL 셰이더용). `#EA4335` → `[0.918, 0.263, 0.208]` */
export function hexToUnitRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  const unit = (channel: number) => Math.round((channel / 255) * 1000) / 1000
  return [
    unit((value >> 16) & 255),
    unit((value >> 8) & 255),
    unit(value & 255),
  ]
}
