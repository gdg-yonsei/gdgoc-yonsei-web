import type { MetadataRoute } from 'next'
import { getSiteEnv } from '@/lib/server/env'

const siteEnv = getSiteEnv()

export default function generateRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Admin and auth pages remain crawlable so bots can observe their
      // X-Robots-Tag/meta noindex directives. Authentication protects access.
      disallow: ['/api'],
    },
    sitemap: `${siteEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
    host: siteEnv.NEXT_PUBLIC_SITE_URL,
  }
}
