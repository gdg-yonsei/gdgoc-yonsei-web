/**
 * `/robots.txt` 생성.
 */
import type { MetadataRoute } from 'next'
import { getSiteEnv } from '@/lib/server/env'

const siteEnv = getSiteEnv()

/** 크롤러 규칙과 사이트맵 위치. */
export default function generateRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 관리자·인증 페이지는 크롤링을 허용해야 봇이 X-Robots-Tag/meta noindex 지시를 읽고
      // 색인에서 뺀다. 접근 자체는 로그인으로 막는다.
      disallow: ['/api'],
    },
    sitemap: `${siteEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
    host: siteEnv.NEXT_PUBLIC_SITE_URL,
  }
}
