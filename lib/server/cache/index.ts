import 'server-only'

import { cacheLife, cacheTag, revalidatePath, revalidateTag, updateTag } from 'next/cache'
import { i18n } from '@/i18n-config'
import type { PublicCacheProfile } from '@/lib/server/cache/policy'

export * from '@/lib/server/cache/invalidation'
export * from '@/lib/server/cache/policy'
export * from '@/lib/server/cache/tags'
export { revalidatePath, revalidateTag, updateTag }

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function normalizeTags(tags: readonly string[] | string): string[] {
  return typeof tags === 'string' ? [tags] : uniqueStrings(tags)
}

export function cacheQuery(
  profile: PublicCacheProfile,
  tags: readonly string[]
) {
  cacheLife(profile)
  cacheTag(...uniqueStrings(tags))
}

export function updateCacheTags(tags: readonly string[] | string) {
  for (const tag of normalizeTags(tags)) {
    updateTag(tag)
  }
}

export function revalidateCacheTags(tags: readonly string[] | string) {
  for (const tag of normalizeTags(tags)) {
    revalidateTag(tag, 'max')
  }
}

export function localizedPublicPath(pathname: `/${string}`): string[] {
  return i18n.locales.map((locale) => `/${locale}${pathname}`)
}

export function revalidateLocalizedPublicPaths(paths: readonly string[]) {
  for (const path of uniqueStrings(paths)) {
    revalidatePath(path)
  }
}
