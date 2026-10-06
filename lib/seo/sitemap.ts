import 'server-only'

import type { MetadataRoute } from 'next'
import { i18n } from '@/lib/i18n'
import { getLanguageAlternates, getLocalizedUrl } from '@/lib/seo/metadata'

/** 언어 없는 경로를 가진 사이트맵 항목. */
export type SitemapPathEntry = Omit<
  MetadataRoute.Sitemap[number],
  'url' | 'alternates'
> & {
  path: string
}

/** 항목 하나를 언어별 URL 항목으로 펼치고, 서로를 hreflang 대체 링크로 연결한다. */
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
