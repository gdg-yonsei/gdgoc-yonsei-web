import 'server-only'

import type { MetadataRoute } from 'next'
import { i18n } from '@/i18n-config'
import { getLanguageAlternates, getLocalizedUrl } from '@/lib/seo/metadata'

export type SitemapPathEntry = Omit<
  MetadataRoute.Sitemap[number],
  'url' | 'alternates'
> & {
  path: string
}

export function localizeSitemapEntries(
  entries: SitemapPathEntry[]
): MetadataRoute.Sitemap {
  return entries.flatMap(({ path, ...entry }) => {
    const languages = getLanguageAlternates(path)

    return i18n.locales.map((locale) => ({
      ...entry,
      url: getLocalizedUrl(locale, path),
      alternates: { languages },
    }))
  })
}
