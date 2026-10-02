/**
 * 프로젝트 태그 규칙(개수·길이 제한, 중복 제거).
 *
 * zod 스키마와 관리자 태그 입력 컴포넌트가 함께 쓴다. 입력 컴포넌트는 브라우저에서 돌아가므로
 * 이 파일은 zod를 import하지 않는다.
 */
/** 프로젝트 하나에 붙일 수 있는 최대 태그 수. */
export const MAX_PROJECT_TAGS = 12
/** 태그 하나의 최대 길이. */
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
