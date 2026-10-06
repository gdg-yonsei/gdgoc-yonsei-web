// 변경 화면은 즉시 태그 만료로 저장값을 보이고, 홈·사이트맵 등 간접 영향 화면은 백그라운드 갱신한다.
// 경로 무효화는 언어별 공개 경로의 보조 수단이다.
import 'server-only'

import { revalidatePath } from 'next/cache'
import { i18n } from '@/lib/i18n'
import {
  generationLatestTag,
  generationListTag,
  homeTag,
  memberGenerationTag,
  memberListTag,
  memberTag,
  projectGenerationTag,
  projectListTag,
  projectDetailsTag,
  projectTag,
  sessionGenerationTag,
  sessionListTag,
  sessionDetailsTag,
  sessionTag,
  sitemapTag,
} from '@/lib/server/cache/tags'
import {
  type LocalizedPublicRoute,
  localizedPublicPaths,
  revalidateCacheTags,
  revalidateLocalizedPublicPaths,
  toLocalizedPublicRoute,
  uniqueStrings,
  updateCacheTags,
} from '@/lib/server/cache/utils'
import { generationPath, projectPath, sessionPath } from '@/lib/site/routes'

function generationScopedPaths(
  generationNames: readonly string[]
): LocalizedPublicRoute[] {
  return generationNames.flatMap((generationName) => [
    toLocalizedPublicRoute(generationPath('member', generationName)),
    toLocalizedPublicRoute(generationPath('project', generationName)),
    toLocalizedPublicRoute(generationPath('session', generationName)),
  ])
}

// 전체 새로고침은 목록을 즉시 만료하고 상세는 공용 태그로 stale 처리해 재생성 폭주를 피한다.
// 상세의 다음 방문은 기존 내용을 받고 백그라운드 갱신하며 그다음부터 새 내용을 본다.
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
  revalidateCacheTags(
    i18n.locales.flatMap((locale) => [
      projectDetailsTag(locale),
      sessionDetailsTag(locale),
    ])
  )
  revalidateLocalizedPublicPaths(
    localizedPublicPaths(['/', '/calendar', '/member', '/project', '/session'])
  )
  revalidatePath('/sitemap.xml')
}

/** 기수가 바뀌었을 때. 바뀌기 전·후 기수 이름의 아카이브를 모두 지운다. */
export function invalidateGenerationPublicCache(args: {
  previousGenerationName?: string | null | undefined
  nextGenerationName?: string | null | undefined
}) {
  const generationNames = uniqueStrings([
    args.previousGenerationName,
    args.nextGenerationName,
  ])

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

/** 파트(구성원 소속)가 바뀌었을 때. 구성원 디렉터리와 세션 기록에 파트 이름이 보이기 때문이다. */
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

/** 구성원 정보가 바뀌었을 때. 구성원이 속한 모든 기수의 디렉터리를 지운다. */
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

/** 프로젝트가 생성·수정·삭제됐을 때. 이전·새 기수 목록과 상세 페이지를 지운다. */
export function invalidateProjectPublicCache(args: {
  projectId: string
  previousGenerationName?: string | null | undefined
  nextGenerationName?: string | null | undefined
}) {
  const generationNames = uniqueStrings([
    args.previousGenerationName,
    args.nextGenerationName,
  ])

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
        toLocalizedPublicRoute(generationPath('project', generationName)),
        toLocalizedPublicRoute(projectPath(generationName, args.projectId)),
      ])
    ),
  ])
}

/** 세션이 생성·수정·삭제됐을 때. 캘린더, 세션 기록, 기수 목록, 상세 페이지를 지운다. */
export function invalidateSessionPublicCache(args: {
  sessionId: string
  previousGenerationName?: string | null | undefined
  nextGenerationName?: string | null | undefined
}) {
  const generationNames = uniqueStrings([
    args.previousGenerationName,
    args.nextGenerationName,
  ])

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
    ...localizedPublicPaths(['/calendar', '/session']),
    ...localizedPublicPaths(
      generationNames.flatMap((generationName) => [
        toLocalizedPublicRoute(generationPath('session', generationName)),
        toLocalizedPublicRoute(sessionPath(generationName, args.sessionId)),
      ])
    ),
  ])
}
