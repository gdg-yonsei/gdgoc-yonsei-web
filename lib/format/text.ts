/** `fillTemplate('{count} sessions', { count: 3 })` → `3 sessions` */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    key in values ? String(values[key]) : token
  )
}

/** Picks the singular or plural template and fills `{count}`. */
export function countLabel(count: number, one: string, many: string): string {
  return fillTemplate(count === 1 ? one : many, { count })
}

const HANGUL = /^[ㄱ-ㆎ가-힣]/

/** Avatar initials: `Minji Kim` → `MK`, `김민지` → `김`. */
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
