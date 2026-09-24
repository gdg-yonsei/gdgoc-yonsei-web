import 'server-only'

import type { MetadataRoute } from 'next'
import { i18n } from '@/i18n-config'
import { cacheQuery, sitemapTag } from '@/lib/server/cache'
import {
  getSessionVisibilityBucket,
  publicCachePolicy,
} from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { getAbsoluteUrl } from '@/lib/seo/metadata'
import { localizeSitemapEntries } from '@/lib/seo/sitemap'
import { buildSitemapPaths } from '@/lib/site/sitemap-paths'

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sitemap,
    i18n.locales.map((locale) => sitemapTag(locale))
  )

  const [generations, sessions, projects] = await Promise.all([
    getGenerationSummaries(i18n.defaultLocale),
    getSessionArchive(getSessionVisibilityBucket()),
    getProjectShowcase(),
  ])

  return localizeSitemapEntries(
    buildSitemapPaths({
      generations,
      sessions,
      projects,
      toAbsolute: getAbsoluteUrl,
    })
  )
}
