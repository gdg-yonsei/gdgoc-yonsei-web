/*
 * Shared by the Zod schema and the admin chip input. Keep this file free of
 * Zod: the input ships to the browser.
 */
export const MAX_PROJECT_TAGS = 12
export const MAX_TAG_LENGTH = 32

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
