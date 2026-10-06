// Redis 공유 캐시는 REDIS_URL이 있을 때만 쓴다. 보안 헤더는 모든 경로, noindex는 관리자·인증·API에 붙인다.
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
  ...(hasSharedRedisCache ? { cacheMaxMemorySize: 0 } : {}),
  poweredByHeader: false,
  // Satori의 Emscripten 로더는 자기 디렉터리의 hb.wasm을 읽어야 한다. 번들 경로가 깨져 500이 나므로 외부 require한다.
  serverExternalPackages: ['satori'],
  experimental: {
    authInterrupts: true,
    // Cache Components로 방문에서 배운 라우트 조각을 재사용해 재방문 화면을 즉시 그린다.
    cachedNavigations: true,
    dynamicOnHover: true,
    exposeTestingApiInProductionBuild: exposeTestingApi,
    // 공개·관리자 루트가 둘이라 없는 URL의 404는 global-not-found가 레이아웃 없이 그린다.
    globalNotFound: true,
    // 작은 Tailwind CSS를 HTML에 넣어 첫 방문의 렌더 차단 스타일시트 요청을 없앤다.
    inlineCss: true,
    optimizePackageImports: [
      '@heroicons/react',
      'animejs',
      'jotai',
      'motion',
      'react-qr-code',
    ],
    // Action이 동적 캐시를 무효화한다. static 수명은 프리페치한 공개 페이지의 재사용 기간을 정한다.
    staleTimes: {
      dynamic: 30,
      static: 600,
    },
    // 컴포넌트 단위 청크로 내비게이션 때 공용 코드를 재사용하면서도, 첫 로드는 적은 요청으로 합친다.
    turbopackChunking: {
      generateComponentChunks: true,
    },
    turbopackFileSystemCacheForBuild: true,
    turbopackRustReactCompiler: true,
    // 연결 단절 시 요청을 대기시키고 연결이 돌아오면 다시 시도한다.
    useOffline: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // 업로드 UUID로 이미지 URL이 바뀌므로 최적화 이미지는 한 달 캐시해도 된다.
    // 한 달 동안 캐시해도 안전하다.
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
  // Next 설정의 headers()는 Promise를 돌려줘야 한다.
  // eslint-disable-next-line @typescript-eslint/require-await
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
        // 지역화 관리자 URL은 proxy rewrite로 크롤링 가능하며 robots가 막지 않아 같은 noindex 헤더가 필요하다.
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
