/**
 * `/sitemap.xml` 생성. 데이터 조회와 캐시는 `lib/server/queries/public/sitemap.ts`가 맡는다.
 */
import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/lib/server/queries/public/sitemap'

/** 모든 공개 페이지의 언어별 URL. */
export default async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries()
}
