import type { NextConfig } from 'next'
import { cacheLifeConfig } from '@/lib/server/cache'

const hasSharedRedisCache = Boolean(process.env.REDIS_URL)

const nextConfig: NextConfig = {
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
}

export default nextConfig
