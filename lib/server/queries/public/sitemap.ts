import 'server-only'

import type { MetadataRoute } from 'next'
import { i18n } from '@/i18n-config'
import { cacheQuery, sitemapTag } from '@/lib/server/cache'
import { getSessionVisibilityBucket, publicCachePolicy } from '@/lib/server/cache/policy'
import { getSiteEnv } from '@/lib/server/env'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjects } from '@/lib/server/queries/public/projects'
import { getPublishedSessionsByGeneration } from '@/lib/server/queries/public/sessions'

const siteEnv = getSiteEnv()

function generateLocalizedSitemapEntries(
  sitemapEntries: MetadataRoute.Sitemap
): MetadataRoute.Sitemap {
  return i18n.locales.flatMap((locale) =>
    sitemapEntries.map((item) => ({
      ...item,
      url: `${siteEnv.NEXT_PUBLIC_SITE_URL}/${locale}${item.url}`,
      lastModified: item.lastModified || new Date(),
      changeFrequency: item.changeFrequency || 'monthly',
      priority: item.priority || 0.5,
    }))
  )
}

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sitemap, i18n.locales.map((locale) => sitemapTag(locale)))

  const baseLocale = i18n.defaultLocale
  const generationList = await getGenerationSummaries(baseLocale)
  const projectList = await getProjects(baseLocale)
  const visibilityBucket = getSessionVisibilityBucket()

  const projectsList: MetadataRoute.Sitemap = projectList.map((project) => ({
    url: `/project/${project.generation.name}/${project.id}`,
    lastModified:
      project.updatedAt > project.createdAt ? project.updatedAt : project.createdAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const sessionsList: MetadataRoute.Sitemap = []

  for (const generation of generationList) {
    const sessions = await getPublishedSessionsByGeneration(
      generation.name,
      baseLocale,
      visibilityBucket
    )

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

  return generateLocalizedSitemapEntries([
    {
      url: '',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: '/calendar',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...centralPages,
    ...projectsList,
    ...sessionsList,
  ])
}
