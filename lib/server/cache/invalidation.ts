/**
 * 관리자 데이터 변경 후 공개 사이트 캐시를 무효화하는 함수 모음.
 *
 * 변경 종류마다 어떤 캐시를 지울지 이 파일 한 곳에서 정한다. 서비스 계층
 * (`lib/server/services/admin/*`)이 DB 쓰기 직후 호출한다.
 *
 * 두 단계로 나눠 무효화한다.
 * - 즉시(immediate) 태그: 방금 바꾼 데이터를 보여 주는 화면. `updateCacheTags`로 바로
 *   지워 관리자가 저장 직후 공개 페이지에서 변경을 볼 수 있게 한다(read-your-own-writes).
 * - 백그라운드(background) 태그: 간접적으로 영향을 받는 화면(홈, 사이트맵 등).
 *   `revalidateCacheTags`로 다음 방문 때 새로 계산하게 한다.
 * 경로 무효화(`revalidatePath`)는 언어별 공개 경로를 보조로 지울 때만 쓴다.
 */
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

/** 기수 이름별 기수 아카이브 경로(구성원·프로젝트·세션). */
function generationScopedPaths(
  generationNames: readonly string[]
): LocalizedPublicRoute[] {
  return generationNames.flatMap((generationName) => [
    toLocalizedPublicRoute(generationPath('member', generationName)),
    toLocalizedPublicRoute(generationPath('project', generationName)),
    toLocalizedPublicRoute(generationPath('session', generationName)),
  ])
}

/**
 * 공개 사이트 캐시를 모두 지운다(관리자 사이드바의 새로고침 버튼).
 *
 * - 목록(홈, 허브, 기수 목록, 사이트맵)은 즉시 지워 다음 요청이 새로 계산한다.
 * - 세션·프로젝트 상세는 공용 태그(`*:items:*`)로 한 번에 오래된 것으로 표시한다(`'max'`). id를 읽지
 *   않아도 되고, 상세 페이지 수백 개를 한꺼번에 다시 만들지 않는다. 다음 방문은 이전 내용을 받으면서
 *   백그라운드에서 새로 만들고, 그다음 방문부터 새 내용이 보인다.
 */
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
  previousGenerationName?: string | null
  nextGenerationName?: string | null
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
  previousGenerationName?: string | null
  nextGenerationName?: string | null
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
  previousGenerationName?: string | null
  nextGenerationName?: string | null
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
