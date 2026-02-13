import type { MetadataRoute } from 'next'
import db from '@/db'
import getGenerationSummaries from '@/lib/server/fetcher/getGenerationList'
import getPublishedSessionsByGeneration from '@/app/(home)/[lang]/session/[generation]/getSessionList'

/**
 * `generateLocalizedSitemapEntries` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
function generateLocalizedSitemapEntries(
  sitemapEntries: MetadataRoute.Sitemap
) {
  const langs = ['ko', 'en']

  return langs.flatMap((lang) => {
    return sitemapEntries.map((item) => ({
      ...item,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}${item.url}`,
      lastModified: item.lastModified || new Date(),
      changeFrequency: item.changeFrequency || 'monthly',
      priority: item.priority || 0.5,
    }))
  })
}

/**
 * `generateSitemap` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export default async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  const generationList = await getGenerationSummaries()

  const projectsList: MetadataRoute.Sitemap = (
    await db.query.projects.findMany({
      columns: {
        id: true,
        updatedAt: true,
        createdAt: true,
        generationId: true,
      },
    })
  ).map((project) => {
    const generationName = generationList.filter(
      (item) => item.id === project.generationId
    )[0].name
    return {
      url: `/project/${generationName}/${project.id}`,
      lastModified:
        project.updatedAt > project.createdAt
          ? project.updatedAt
          : project.createdAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  const sessionsList: MetadataRoute.Sitemap = []

  for (const generation of generationList) {
    const sessions = await getPublishedSessionsByGeneration(generation.name)
    if (sessions) {
      for (const session of sessions) {
        sessionsList.push({
          url: `/session/${generation.name}/${session.id}`,
          lastModified:
            session.updatedAt > session.createdAt
              ? session.updatedAt
              : session.createdAt,
          changeFrequency: 'monthly',
          priority: 0.8,
        })
      }
    }
  }

  const centralPages: MetadataRoute.Sitemap = generationList.flatMap(
    (generation) => [
      {
        url: `/member/${generation.name}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
      {
        url: `/session/${generation.name}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
      {
        url: `/project/${generation.name}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
    ]
  )

  const sitemapList: MetadataRoute.Sitemap = [
    {
      url: '',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `/calendar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...centralPages,
    ...projectsList,
    ...sessionsList,
  ]

  return generateLocalizedSitemapEntries(sitemapList)
}
