/**
 * Next.js 설정.
 *
 * 핵심 선택
 * - Cache Components(`cacheComponents`)와 React Compiler를 켠다.
 * - `REDIS_URL`이 있으면 캐시를 Redis에 저장해 여러 서버 인스턴스가 공유한다
 *   (`lib/server/cache/handlers/*`). 없으면 메모리 캐시를 쓴다.
 * - 보안 헤더는 모든 경로에, 검색 차단 헤더는 관리자·인증·API 경로에 붙인다.
 */
import type { NextConfig } from 'next'
import { cacheLifeConfig } from './lib/server/cache/policy'

/** Redis 공유 캐시를 쓸지. */
const hasSharedRedisCache = Boolean(process.env.REDIS_URL)
/** 운영 빌드에서도 Playwright 테스트 API를 열지(e2e 운영 빌드 테스트 전용). */
const exposeTestingApi = process.env.NEXT_EXPOSE_TESTING_API === '1'
/** 모든 응답에 붙이는 보안 헤더. */
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

/** 검색 엔진 색인을 막는 헤더(관리자, 인증, API). */
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
  // satori 0.30 이상은 harfbuzzjs로 글자를 배치하는데, 그 Emscripten 로더가 실행 중에 자기
  // 디렉터리에서 hb.wasm을 읽는다. Turbopack으로 번들하면 경로가 /ROOT/node_modules/...로 바뀌어
  // 소셜 이미지 요청이 모두 500이 되므로, satori는 node_modules에서 직접 require하게 한다.
  serverExternalPackages: ['satori'],
  experimental: {
    authInterrupts: true,
    // 실제 내비게이션에서 배운 라우트 조각을 재사용해, 같은·비슷한 페이지를 다시 방문할 때
    // 즉시 그린다(Cache Components 필요).
    cachedNavigations: true,
    // 링크에 마우스를 올리면 부분 프리페치를 전체 페이지 데이터로 올린다.
    dynamicOnHover: true,
    exposeTestingApiInProductionBuild: exposeTestingApi,
    // 루트 레이아웃이 공개 사이트·관리자 두 개라, 어떤 경로와도 맞지 않는 URL의 404는
    // app/global-not-found.tsx가 레이아웃 없이 직접 그린다.
    globalNotFound: true,
    // Tailwind는 원자적 클래스라 페이지별 스타일이 작다. CSS를 HTML에 넣어 첫 방문자의
    // 렌더링을 막는 스타일시트 요청을 없앤다.
    inlineCss: true,
    optimizePackageImports: [
      '@heroicons/react',
      'animejs',
      'jotai',
      'motion',
      'react-qr-code',
    ],
    // 동적 구간은 데이터 변경 후에도 신선하게 유지된다(Server Action이 라우터 캐시를 무효화).
    // static 값은 주로 프리페치한 공개 페이지를 내비게이션에서 얼마나 오래 재사용할지 늘린다.
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
    // 연결이 끊기면 내비게이션·fetch·데이터 변경을 바로 실패시키지 않고 기다렸다가, 연결이
    // 돌아오면 다시 시도한다.
    useOffline: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // 관리자 업로드는 UUID 객체 키를 쓰므로 이미지가 바뀌면 URL도 바뀐다. 최적화된 이미지를
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
        // `/en/admin/...`, `/ko/admin/...`는 proxy가 `/admin/...`으로 rewrite하므로 URL 자체는
        // 크롤링 가능한 상태로 남는다. robots.txt가 관리자 경로를 막지 않으므로 지역화된
        // 경로에도 같은 noindex 헤더가 필요하다.
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
