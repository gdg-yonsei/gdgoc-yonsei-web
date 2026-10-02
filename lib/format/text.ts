/**
 * 문구 조립 헬퍼(템플릿 채우기, 단수·복수, 이니셜). 서버·클라이언트 공용 순수 함수.
 */

/** 템플릿의 `{이름}` 자리를 값으로 채운다. `fillTemplate('{count} sessions', { count: 3 })` → `3 sessions` */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    key in values ? String(values[key]) : token
  )
}

/** 개수에 따라 단수·복수 템플릿을 골라 `{count}`를 채운다. */
export function countLabel(count: number, one: string, many: string): string {
  return fillTemplate(count === 1 ? one : many, { count })
}

const HANGUL = /^[ㄱ-ㆎ가-힣]/

/** 아바타 이니셜: `Minji Kim` → `MK`, `김민지` → `김`. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]
  if (!first) return '?'
  if (HANGUL.test(first)) return first.slice(0, 1)
  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toUpperCase())
    .join('')
}
