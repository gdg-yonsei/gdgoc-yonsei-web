import type { NextConfig } from 'next'
import { cacheLifeConfig } from './lib/server/cache/policy'

const hasSharedRedisCache = Boolean(process.env.REDIS_URL)
const exposeTestingApi = process.env.NEXT_EXPOSE_TESTING_API === '1'
const securityHeaders = [
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const noIndexHeaders = [
  {
    key: 'X-Robots-Tag',
    value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  cacheHandler: hasSharedRedisCache
    ? require.resolve('./lib/server/cache/handlers/incremental-redis-cache-handler.cjs')
    : undefined,
  cacheHandlers: {
    default:
      require.resolve('next/dist/server/lib/cache-handlers/default.external'),
    remote:
      require.resolve('./lib/server/cache/handlers/remote-cache-handler.cjs'),
  },
  cacheLife: cacheLifeConfig,
  cacheMaxMemorySize: hasSharedRedisCache ? 0 : undefined,
  experimental: {
    authInterrupts: true,
    exposeTestingApiInProductionBuild: exposeTestingApi,
    optimizePackageImports: ['motion', 'jotai', 'react-qr-code'],
    turbopackFileSystemCacheForBuild: true,
    turbopackRustReactCompiler: true,
  },
  images: {
    // Admin uploads use UUID object keys, so a changed image always receives a
    // new URL and optimized variants can safely stay warm for a month.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'image.gdgyonsei.moveto.kr',
      },
      {
        protocol: 'https',
        hostname: 'dev.image.gdgyonsei.moveto.kr',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/admin/:path*',
        headers: noIndexHeaders,
      },
      {
        // `/en/admin/...`, `/ko/admin/...`는 proxy에서 `/admin/...`으로 rewrite 되므로
        // URL 자체가 크롤링 가능한 상태로 남습니다. robots.txt가 더 이상 admin 경로를
        // 막지 않기 때문에 지역화된 경로에도 동일한 noindex 헤더가 필요합니다.
        source: '/:lang(en|ko)/admin/:path*',
        headers: noIndexHeaders,
      },
      {
        source: '/auth/:path*',
        headers: noIndexHeaders,
      },
      {
        source: '/api/:path*',
        headers: noIndexHeaders,
      },
    ]
  },
}

export default nextConfig
