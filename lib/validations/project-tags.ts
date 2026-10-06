// 브라우저의 태그 입력도 공유하므로 이 규칙 모듈에는 zod를 가져오지 않는다.
export const MAX_PROJECT_TAGS = 12
export const MAX_TAG_LENGTH = 32

/** 앞뒤 공백을 지우고 대소문자를 무시해 중복을 뺀다(처음 나온 표기를 유지). */
export function dedupeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const tag = raw.trim()
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}
