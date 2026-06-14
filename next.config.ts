import type { NextConfig } from 'next'
import { cacheLifeConfig } from './lib/server/cache/policy'

const hasSharedRedisCache = Boolean(process.env.REDIS_URL)
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
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  cacheComponents: true,
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
    optimizePackageImports: ['motion', 'jotai', 'next-auth', 'react-qr-code'],
  },
  images: {
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
    ]
  },
}

export default nextConfig
