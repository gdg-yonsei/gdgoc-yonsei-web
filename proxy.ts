/**
 * Next.js 16 Proxy(예전 Middleware). 모든 요청이 페이지에 닿기 전에 여기를 지난다.
 *
 * 하는 일
 * 1. 언어가 없는 공개 경로(`/session`)를 브라우저 언어에 맞춰 `/en/session` 등으로 리다이렉트
 * 2. 관리자 경로: `/ko/admin/...`을 `/admin/...`으로 rewrite하고 언어를 `x-admin-locale`
 *    헤더와 쿠키로 넘긴다(관리자 화면은 URL 언어 세그먼트 없이 한 벌만 있다)
 * 3. 존재하지 않는 기수·상세 페이지를 DB로 확인해 404 HTML을 바로 돌려준다. Cache Components는
 *    페이지를 스트리밍하므로 페이지 안에서 `notFound()`를 부르면 상태 코드가 이미 200으로 나간
 *    뒤일 수 있다. 실제 404 상태 코드를 보장하려고 여기서 막는다.
 * 4. 관리자 상세 화면도 같은 이유로, 승인된 사용자의 요청이면 항목이 있는지 확인하고 없으면 전역
 *    404로 rewrite한다(`lib/server/admin-route-exists.ts`).
 *
 * API, 인증, `.well-known`, 폰트, 루트 정적 파일은 건드리지 않는다.
 */
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

/** 언어 세그먼트를 붙이지 않는 루트 정적 파일(검색 엔진 소유 확인 파일 포함). */
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

/** 브라우저 `Accept-Language` 헤더에서 지원 언어 중 가장 알맞은 언어를 고른다. */
function getLocale(request: NextRequest): string | undefined {
  // Negotiator는 일반 객체를 받으므로 Headers를 객체로 바꾼다
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  const locales = [...i18n.locales]

  // negotiator로 선호 언어 목록을 읽고 intl-localematcher로 가장 알맞은 지원 언어를 고른다
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales
  )

  return matchLocale(languages, locales, i18n.defaultLocale)
}

/** 존재 여부를 확인할 공개 동적 페이지(기수 아카이브, 프로젝트·세션 상세). */
type PublicRouteIdentity =
  | { kind: 'generation'; generation: string }
  | { kind: 'project'; generation: string; id: string }
  | { kind: 'session'; generation: string; id: string }

/**
 * HTML 문서 요청(GET/HEAD)인지. 클라이언트 내비게이션의 RSC 요청(`text/x-component`)은 상태 코드가
 * 화면에 드러나지 않으므로 존재 확인 없이 페이지가 처리하게 둔다.
 */
function isDocumentRequest(request: NextRequest) {
  return (
    ['GET', 'HEAD'].includes(request.method) &&
    !(request.headers.get('accept') ?? '').includes('text/x-component')
  )
}

/** 어떤 라우트와도 맞지 않는 주소. rewrite하면 `app/global-not-found.tsx`가 404 상태로 응답한다. */
const ADMIN_NOT_FOUND_PATH = '/admin/__not-found'

/**
 * 존재하지 않는 관리자 상세 화면이면 일치하는 라우트가 없는 주소로 rewrite해 전역 404를 진짜 404 상태로
 * 돌려준다. 확인 대상이 아니거나 항목이 있으면 `null`.
 * @param adminPathname 언어 접두사를 뗀 `/admin/...` 경로
 */
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

/** 요청이 존재 확인 대상 공개 페이지인지 판별한다. HTML 문서 요청만 대상이다. */
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

/**
 * 페이지가 실제로 있는지 DB로 확인한다. 세션은 공개 페이지와 같은 기준(웹사이트 표시,
 * 이미 끝난 세션)으로 본다.
 */
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

/** 404 페이지에 넣을 GDG 괄호 SVG. */
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

/** 404 상태 코드와 함께 돌려줄 가벼운 인라인 HTML 페이지. */
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

/** Proxy 진입점. 아무것도 돌려주지 않으면 요청이 그대로 페이지로 간다. */
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

  // 경로에 지원 언어 세그먼트가 있는지 확인한다
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // 언어가 없으면 브라우저 언어로 리다이렉트한다
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)

    // 예: /session 요청 → /ko/session
    const redirectUrl = new URL(
      `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
      request.url
    )
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl)
  }
}

/** Proxy를 실행할 경로. */
export const config = {
  // `_next` 내부 경로를 뺀 모든 경로를 지역화 대상으로 본다. 알려진 루트 정적 파일은
  // UNLOCALIZED_PUBLIC_PATHS로 따로 처리하므로, 점이 들어간 임의 경로가 언어 세그먼트처럼
  // 보여 색인 가능한 중복 페이지가 생기는 일을 막는다.
  matcher: ['/((?!_next/).*)'],
}
