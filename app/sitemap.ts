import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/lib/server/queries/public/sitemap'

export default async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries()
}
