import 'server-only'

import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import type { Locale } from '@/i18n-config'
import { i18n } from '@/i18n-config'
import {
  generationLatestTag,
  generationListTag,
  homeTag,
  memberGenerationTag,
  memberListTag,
  memberTag,
  projectGenerationTag,
  projectListTag,
  projectTag,
  sessionGenerationTag,
  sessionListTag,
  sessionTag,
  sitemapTag,
} from '@/lib/server/cache/tags'

type LocalizedPublicRoute = `/${string}`

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function toLocalizedPublicRoute(pathname: string): LocalizedPublicRoute {
  return pathname as LocalizedPublicRoute
}

function updateCacheTags(tags: readonly string[]) {
  for (const tag of uniqueStrings(tags)) {
    updateTag(tag)
  }
}

function revalidateCacheTags(tags: readonly string[]) {
  for (const tag of uniqueStrings(tags)) {
    revalidateTag(tag, 'max')
  }
}

function revalidateLocalizedPublicPaths(paths: readonly string[]) {
  for (const path of uniqueStrings(paths)) {
    revalidatePath(path)
  }
}

function publicPath(
  pathname: LocalizedPublicRoute,
  locale: Locale
): LocalizedPublicRoute {
  return toLocalizedPublicRoute(`/${locale}${pathname}`)
}

function localizedPublicPaths(pathnames: readonly LocalizedPublicRoute[]): string[] {
  return i18n.locales.flatMap((locale) =>
    pathnames.map((pathname) => publicPath(pathname, locale))
  )
}

function generationScopedPaths(
  generationNames: readonly string[]
): LocalizedPublicRoute[] {
  return generationNames.flatMap((generationName) => [
    toLocalizedPublicRoute(`/member/${generationName}`),
    toLocalizedPublicRoute(`/project/${generationName}`),
    toLocalizedPublicRoute(`/session/${generationName}`),
  ])
}

export function invalidateAllPublicCache() {
  const immediateTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      generationListTag(locale),
      generationLatestTag(locale),
      memberListTag(locale),
      projectListTag(locale),
      sessionListTag(locale),
      homeTag(locale),
      sitemapTag(locale),
    ])
  )

  updateCacheTags(immediateTags)
  revalidateLocalizedPublicPaths(
    localizedPublicPaths(['/', '/calendar', '/member', '/project', '/session'])
  )
  revalidatePath('/sitemap.xml')
}

export function invalidateGenerationPublicCache(args: {
  previousGenerationName?: string | null
  nextGenerationName?: string | null
}) {
  const generationNames = uniqueStrings(
    [args.previousGenerationName, args.nextGenerationName].filter(Boolean) as string[]
  )

  const immediateTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      generationListTag(locale),
      generationLatestTag(locale),
      ...generationNames.flatMap((generationName) => [
        memberGenerationTag(generationName, locale),
        projectGenerationTag(generationName, locale),
        sessionGenerationTag(generationName, locale),
      ]),
    ])
  )

  const backgroundTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      homeTag(locale),
      memberListTag(locale),
      projectListTag(locale),
      sessionListTag(locale),
      sitemapTag(locale),
    ])
  )

  updateCacheTags(immediateTags)
  revalidateCacheTags(backgroundTags)
  revalidateLocalizedPublicPaths([
    ...localizedPublicPaths(['/member', '/project', '/session']),
    ...localizedPublicPaths(generationScopedPaths(generationNames)),
  ])
}

export function invalidatePartPublicCache(generationNames: readonly string[]) {
  const uniqueGenerationNames = uniqueStrings(generationNames)

  const immediateTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      memberListTag(locale),
      sessionListTag(locale),
      ...uniqueGenerationNames.flatMap((generationName) => [
        memberGenerationTag(generationName, locale),
        sessionGenerationTag(generationName, locale),
      ]),
    ])
  )

  const backgroundTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      generationListTag(locale),
      generationLatestTag(locale),
      homeTag(locale),
      sitemapTag(locale),
    ])
  )

  updateCacheTags(immediateTags)
  revalidateCacheTags(backgroundTags)
  revalidateLocalizedPublicPaths(
    localizedPublicPaths(generationScopedPaths(uniqueGenerationNames))
  )
}

export function invalidateMemberPublicCache(args: {
  memberId?: string
  generationNames?: readonly string[]
}) {
  const generationNames = uniqueStrings(args.generationNames ?? [])

  const immediateTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      memberListTag(locale),
      ...(args.memberId ? [memberTag(args.memberId, locale)] : []),
      ...generationNames.map((generationName) =>
        memberGenerationTag(generationName, locale)
      ),
    ])
  )

  const backgroundTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      projectListTag(locale),
      sessionListTag(locale),
      sitemapTag(locale),
    ])
  )

  updateCacheTags(immediateTags)
  revalidateCacheTags(backgroundTags)
  revalidateLocalizedPublicPaths(
    localizedPublicPaths(generationScopedPaths(generationNames))
  )
}

export function invalidateProjectPublicCache(args: {
  projectId: string
  previousGenerationName?: string | null
  nextGenerationName?: string | null
}) {
  const generationNames = uniqueStrings(
    [args.previousGenerationName, args.nextGenerationName].filter(Boolean) as string[]
  )

  const immediateTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      projectListTag(locale),
      projectTag(args.projectId, locale),
      ...generationNames.map((generationName) =>
        projectGenerationTag(generationName, locale)
      ),
    ])
  )

  const backgroundTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      generationListTag(locale),
      homeTag(locale),
      sitemapTag(locale),
    ])
  )

  updateCacheTags(immediateTags)
  revalidateCacheTags(backgroundTags)
  revalidateLocalizedPublicPaths([
    ...localizedPublicPaths(['/project']),
    ...localizedPublicPaths(
      generationNames.flatMap((generationName) => [
        toLocalizedPublicRoute(`/project/${generationName}`),
        toLocalizedPublicRoute(`/project/${generationName}/${args.projectId}`),
      ])
    ),
  ])
}

export function invalidateSessionPublicCache(args: {
  sessionId: string
  previousGenerationName?: string | null
  nextGenerationName?: string | null
}) {
  const generationNames = uniqueStrings(
    [args.previousGenerationName, args.nextGenerationName].filter(Boolean) as string[]
  )

  const immediateTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      sessionListTag(locale),
      sessionTag(args.sessionId, locale),
      ...generationNames.map((generationName) =>
        sessionGenerationTag(generationName, locale)
      ),
    ])
  )

  const backgroundTags = uniqueStrings(
    i18n.locales.flatMap((locale) => [
      generationListTag(locale),
      homeTag(locale),
      sitemapTag(locale),
    ])
  )

  updateCacheTags(immediateTags)
  revalidateCacheTags(backgroundTags)
  revalidateLocalizedPublicPaths([
    ...localizedPublicPaths(['/session']),
    ...localizedPublicPaths(
      generationNames.flatMap((generationName) => [
        toLocalizedPublicRoute(`/session/${generationName}`),
        toLocalizedPublicRoute(`/session/${generationName}/${args.sessionId}`),
      ])
    ),
  ])
}
