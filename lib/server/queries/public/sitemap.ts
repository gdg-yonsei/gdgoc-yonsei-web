import 'server-only'

import type { MetadataRoute } from 'next'
import { i18n } from '@/i18n-config'
import { cacheQuery, sitemapTag } from '@/lib/server/cache'
import {
  getSessionVisibilityBucket,
  publicCachePolicy,
} from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjects } from '@/lib/server/queries/public/projects'
import { getPublishedSessionsForSitemap } from '@/lib/server/queries/public/sessions'
import {
  localizeSitemapEntries,
  type SitemapPathEntry,
} from '@/lib/seo/sitemap'

const staticPages: SitemapPathEntry[] = [
  { path: '' },
  { path: '/about' },
  { path: '/calendar' },
  { path: '/member' },
  { path: '/project' },
  { path: '/session' },
  { path: '/privacy-policy' },
  { path: '/terms-of-service' },
  { path: '/2026-freshman-ot' },
]

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sitemap,
    i18n.locales.map((locale) => sitemapTag(locale))
  )

  const baseLocale = i18n.defaultLocale
  const visibilityBucket = getSessionVisibilityBucket()
  const [generationList, projectList, sessionList] = await Promise.all([
    getGenerationSummaries(baseLocale),
    getProjects(baseLocale),
    getPublishedSessionsForSitemap(baseLocale, visibilityBucket),
  ])

  const projectsList: SitemapPathEntry[] = projectList.map((project) => ({
    path: `/project/${project.generation.name}/${project.id}`,
    lastModified:
      project.updatedAt > project.createdAt
        ? project.updatedAt
        : project.createdAt,
  }))

  const sessionsList: SitemapPathEntry[] = sessionList.flatMap((session) => {
    if (!session.generationName) {
      return []
    }

    return [
      {
        path: `/session/${session.generationName}/${session.id}`,
        lastModified:
          session.updatedAt > session.createdAt
            ? session.updatedAt
            : session.createdAt,
      },
    ]
  })

  const centralPages: SitemapPathEntry[] = generationList.flatMap(
    (generation) => [
      {
        path: `/member/${generation.name}`,
      },
      {
        path: `/session/${generation.name}`,
      },
      {
        path: `/project/${generation.name}`,
      },
    ]
  )

  return localizeSitemapEntries([
    ...staticPages,
    ...centralPages,
    ...projectsList,
    ...sessionsList,
  ])
}
