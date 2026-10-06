// Cache Components 스트리밍은 notFound 전에 200을 보낼 수 있어 proxy가 공개·승인된 관리자 상세의 404를 보장한다.
// 관리자 언어는 rewrite 뒤 헤더·쿠키로 전달한다. API·인증·디스커버리·폰트·정적 파일은 지역화하지 않는다.
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { i18n, isLocale } from '@/lib/i18n'
import { ADMIN_LOCALE_COOKIE } from '@/lib/admin-i18n'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { sessionWallClockNow } from '@/lib/format/datetime'
import { isUuid } from '@/lib/server/queries/public/uuid'
import {
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  type BracketSide,
} from '@/lib/site/bracket-geometry'
import { CAPSULE_HEX } from '@/lib/site/brand'
import {
  adminRouteExists,
  getAdminRouteIdentity,
  hasApprovedSession,
} from '@/lib/server/admin-route-exists'

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
  '/logos/korea-university.svg',
  '/logos/yonsei-university.svg',
  '/manifest.webmanifest',
  '/naver3b021b84fe69d06591a1108d6f26afac.html',
  '/opengraph-image.png',
  '/project-default.png',
  '/robots.txt',
  '/session-default.png',
  '/sitemap.xml',
  '/twitter-image.png',
])

function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  const locales = [...i18n.locales]

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales
  )

  return matchLocale(languages, locales, i18n.defaultLocale)
}

type PublicRouteIdentity =
  | { kind: 'generation'; generation: string }
  | { kind: 'project'; generation: string; id: string }
  | { kind: 'session'; generation: string; id: string }

// RSC 내비게이션은 상태 코드가 화면에 드러나지 않아 페이지에 맡긴다. 존재 확인은 GET·HEAD HTML 요청만 한다.
function isDocumentRequest(request: NextRequest) {
  return (
    ['GET', 'HEAD'].includes(request.method) &&
    !(request.headers.get('accept') ?? '').includes('text/x-component')
  )
}

const ADMIN_NOT_FOUND_PATH = '/admin/__not-found'

// 없는 관리자 상세는 매칭되지 않는 경로로 rewrite해 전역 404 상태를 보장한다. adminPathname은 언어 없는 경로다.
async function adminRouteNotFound(request: NextRequest, adminPathname: string) {
  const identity = getAdminRouteIdentity(adminPathname)
  if (
    !identity ||
    !isDocumentRequest(request) ||
    !(await hasApprovedSession(request)) ||
    (await adminRouteExists(identity))
  ) {
    return null
  }

  const notFoundUrl = request.nextUrl.clone()
  notFoundUrl.pathname = ADMIN_NOT_FOUND_PATH
  return NextResponse.rewrite(notFoundUrl)
}

function getPublicRouteIdentity(
  request: NextRequest
): PublicRouteIdentity | null {
  if (!isDocumentRequest(request)) {
    return null
  }

  const segments = request.nextUrl.pathname.split('/').filter(Boolean)
  const [locale, section, generation, id] = segments

  if (!isLocale(locale) || !generation) {
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

// 세션 존재 확인은 공개 페이지와 같은 웹사이트 표시·종료 기준을 적용한다.
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
        lte(
          sessions.endAt,
          new Date(getSessionVisibilityBucket(sessionWallClockNow()))
        )
      )
    )
    .limit(1)

  return match.length > 0
}

function bracketSvg(side: BracketSide) {
  const paths = bracketCapsulesInViewBox(side)
    .map(
      (capsule) =>
        `<path d="${capsulePath(capsule)}" fill="${CAPSULE_HEX[capsule.hue]}"/>`
    )
    .join('')
  return `<svg aria-hidden="true" viewBox="0 0 ${BRACKET_VIEWBOX.width} ${BRACKET_VIEWBOX.height}">${paths}</svg>`
}

const NOT_FOUND_BRACKETS = {
  left: bracketSvg('left'),
  right: bracketSvg('right'),
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
      body { margin: 0; background: #1e1e1e; color: #f0f0f0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
      main { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; padding: 1.5rem; text-align: center; }
      h1 { display: flex; align-items: center; gap: 0.12em; margin: 0; font-size: clamp(4rem, 16vw, 9rem); font-weight: 700; letter-spacing: -0.05em; line-height: 1; }
      h1 svg { height: 1.1em; width: auto; }
      p { margin: 0; color: #b4b4b4; }
      a { color: #1e1e1e; background: #f0f0f0; padding: 0.75rem 1.5rem; border-radius: 9999px; font-weight: 600; text-decoration: none; }
      a:focus-visible { outline: 3px solid #4285f4; outline-offset: 4px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${NOT_FOUND_BRACKETS.left}404${NOT_FOUND_BRACKETS.right}</h1>
      <p>${locale === 'ko' ? '페이지를 찾을 수 없어요.' : 'This page slipped out of the brackets.'}</p>
      <a href="/${locale}">${backLabel}</a>
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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const useSecureCookie = process.env.NODE_ENV === 'production'

  if (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    // OAuth/MCP 디스커버리 문서(RFC 8414, RFC 9728)는 고정 경로여야 한다.
    pathname.startsWith('/.well-known/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    // 정적 폰트 파일(Pretendard 서브셋 92개)에는 언어 세그먼트를 붙이면 안 된다.
    pathname.startsWith('/fonts/') ||
    UNLOCALIZED_PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next()
  }

  const pathnameSegments = pathname.split('/')
  const localeFromPath = pathnameSegments[1]
  const isLocalizedAdminPath =
    isLocale(localeFromPath) && pathnameSegments[2] === 'admin'

  if (isLocalizedAdminPath) {
    const adminNotFound = await adminRouteNotFound(
      request,
      `/${pathnameSegments.slice(2).join('/')}`
    )
    if (adminNotFound) {
      return adminNotFound
    }

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
    const adminNotFound = await adminRouteNotFound(request, pathname)
    if (adminNotFound) {
      return adminNotFound
    }

    const localeFromCookie = request.cookies.get(ADMIN_LOCALE_COOKIE)?.value
    const locale = isLocale(localeFromCookie)
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

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)

    const redirectUrl = new URL(
      `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
      request.url
    )
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  // 알려진 정적 파일만 별도 처리해 점이 든 임의 경로도 지역화한다. 언어별 색인 중복을 막는다.
  matcher: ['/((?!_next/).*)'],
}
