import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { i18n } from './i18n-config'
import { ADMIN_LOCALE_COOKIE } from '@/lib/admin-i18n'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { isUuid } from '@/lib/server/queries/public/uuid'

import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { and, eq, lte } from 'drizzle-orm'

const UNLOCALIZED_PUBLIC_PATHS = new Set([
  '/default-image.png',
  '/default-user-profile.png',
  '/favicon.ico',
  '/gdg-logo.svg',
  '/gdgoc-logo.png',
  '/gdgoc-yonsei-logo.svg',
  '/googleda69d559d3e8d484.html',
  '/llms.txt',
  '/manifest.webmanifest',
  '/naver3b021b84fe69d06591a1108d6f26afac.html',
  '/opengraph-image.png',
  '/project-default.png',
  '/robots.txt',
  '/session-default.png',
  '/sitemap.xml',
  '/twitter-image.png',
])

/**
 * `getLocale` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`request`, `NextRequest`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
function getLocale(request: NextRequest): string | undefined {
  // Negotiator expects plain object so we need to transform headers
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // @ts-expect-error - i18n.locales is a readonly array
  const locales: string[] = i18n.locales

  // Use negotiator and intl-localematcher to get best locale
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales
  )

  return matchLocale(languages, locales, i18n.defaultLocale)
}

function isSupportedLocale(locale: string | undefined): locale is string {
  return (
    !!locale && i18n.locales.includes(locale as (typeof i18n.locales)[number])
  )
}

type PublicRouteIdentity =
  | { kind: 'generation'; generation: string }
  | { kind: 'project'; generation: string; id: string }
  | { kind: 'session'; generation: string; id: string }

function getPublicRouteIdentity(
  request: NextRequest
): PublicRouteIdentity | null {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return null
  }

  const accept = request.headers.get('accept') ?? ''
  if (accept.includes('text/x-component')) {
    return null
  }

  const segments = request.nextUrl.pathname.split('/').filter(Boolean)
  const [locale, section, generation, id] = segments

  if (!isSupportedLocale(locale) || !generation) {
    return null
  }

  if (
    segments.length === 3 &&
    (section === 'member' || section === 'project' || section === 'session')
  ) {
    return { kind: 'generation', generation }
  }

  if (segments.length !== 4 || !id) {
    return null
  }

  if (section === 'project') {
    return { kind: 'project', generation, id }
  }

  if (section === 'session') {
    return { kind: 'session', generation, id }
  }

  return null
}

async function publicRouteExists(identity: PublicRouteIdentity) {
  if (identity.kind === 'generation') {
    const match = await db
      .select({ id: generations.id })
      .from(generations)
      .where(eq(generations.name, identity.generation))
      .limit(1)

    return match.length > 0
  }

  if (!isUuid(identity.id)) {
    return false
  }

  if (identity.kind === 'project') {
    const match = await db
      .select({ id: projects.id })
      .from(projects)
      .innerJoin(generations, eq(projects.generationId, generations.id))
      .where(
        and(
          eq(projects.id, identity.id),
          eq(generations.name, identity.generation)
        )
      )
      .limit(1)

    return match.length > 0
  }

  const match = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(parts, eq(sessions.partId, parts.id))
    .innerJoin(generations, eq(parts.generationsId, generations.id))
    .where(
      and(
        eq(sessions.id, identity.id),
        eq(generations.name, identity.generation),
        eq(sessions.displayOnWebsite, true),
        lte(sessions.endAt, new Date(getSessionVisibilityBucket()))
      )
    )
    .limit(1)

  return match.length > 0
}

function publicRouteNotFound(request: NextRequest) {
  const locale = request.nextUrl.pathname.split('/')[1] === 'ko' ? 'ko' : 'en'
  const backLabel = locale === 'ko' ? '홈으로 돌아가기' : 'Back to Home'
  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>404 Not Found | GDGoC Yonsei</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #fafafa; color: #171717; font-family: ui-sans-serif, system-ui, sans-serif; }
      main { display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 1rem; }
      div { display: flex; flex-direction: column; gap: 1rem; }
      img { width: min(100%, 22rem); height: auto; }
      h1 { margin: 0; font-size: clamp(3rem, 8vw, 4rem); line-height: 1; }
      a { width: fit-content; color: inherit; font-size: 1.5rem; font-weight: 600; text-underline-offset: 0.2em; }
      a:focus-visible { outline: 3px solid #1a73e8; outline-offset: 4px; }
    </style>
  </head>
  <body>
    <main>
      <div>
        <img src="/gdgoc-yonsei-logo.svg" width="352" height="64" alt="GDGoC Yonsei" />
        <h1>404 Not Found</h1>
        <a href="/${locale}">${backLabel}</a>
      </div>
    </main>
  </body>
</html>`

  return new NextResponse(request.method === 'HEAD' ? null : html, {
    status: 404,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, max-age=0',
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

/**
 * `proxy` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`request`, `NextRequest`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const useSecureCookie = process.env.NODE_ENV === 'production'

  if (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    // 정적 폰트 에셋(Pretendard 서브셋 92개)은 로케일 프리픽스를 붙이면 안 됩니다.
    pathname.startsWith('/fonts/') ||
    UNLOCALIZED_PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next()
  }

  const pathnameSegments = pathname.split('/')
  const localeFromPath = pathnameSegments[1]
  const isLocalizedAdminPath =
    isSupportedLocale(localeFromPath) && pathnameSegments[2] === 'admin'

  if (isLocalizedAdminPath) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-admin-locale', localeFromPath)
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/${pathnameSegments.slice(2).join('/')}`

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })
    response.cookies.set(ADMIN_LOCALE_COOKIE, localeFromPath, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: useSecureCookie,
    })

    return response
  }

  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')

  if (isAdminPath) {
    const localeFromCookie = request.cookies.get(ADMIN_LOCALE_COOKIE)?.value
    const locale = isSupportedLocale(localeFromCookie)
      ? localeFromCookie
      : (getLocale(request) ?? i18n.defaultLocale)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-admin-locale', locale)

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    response.cookies.set(ADMIN_LOCALE_COOKIE, locale, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: useSecureCookie,
    })

    return response
  }

  const publicRouteIdentity = getPublicRouteIdentity(request)
  if (publicRouteIdentity && !(await publicRouteExists(publicRouteIdentity))) {
    return publicRouteNotFound(request)
  }

  // // `/_next/` and `/api/` are ignored by the watcher, but we need to ignore files in `public` manually.
  // // If you have one
  // if (
  //   [
  //     '/manifest.json',
  //     '/favicon.ico',
  //     // Your other files in `public`
  //   ].includes(pathname)
  // )
  //   return

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)

    // e.g. incoming request is /products
    // The new URL is now /en-US/products
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    )
  }
}

export const config = {
  // Localize every application-looking path. Known root assets are handled by
  // UNLOCALIZED_PUBLIC_PATHS so arbitrary dotted paths cannot impersonate a
  // locale segment and create indexable duplicate pages.
  matcher: ['/((?!_next/).*)'],
}
