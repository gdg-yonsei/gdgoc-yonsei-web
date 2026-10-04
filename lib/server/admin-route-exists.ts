/**
 * proxy가 관리자 상세 화면(`/admin/<리소스>/<id>[/edit|/register]`)의 존재를 미리 확인하는 데 쓰는 헬퍼.
 *
 * Cache Components는 관리자 화면을 스트리밍하므로, 페이지 안의 `notFound()`는 상태 코드 200이 이미 나간 뒤에
 * 404 화면을 그린다. proxy가 응답 전에 항목이 없는 것을 알아내면 일치하는 라우트가 없는 주소로 rewrite해
 * 전역 404(`app/global-not-found.tsx`)가 진짜 404 상태로 나가게 한다. 공개 사이트의 같은 검사는 `proxy.ts`에 있다.
 *
 * 로그인하지 않은(또는 승인 전) 요청에는 검사하지 않는다. 그런 요청은 관리자 레이아웃이 로그인 화면·403으로
 * 보내야 하고, 404와 로그인 이동이 갈리면 로그인 없이도 id가 있는지 알아낼 수 있기 때문이다.
 */
import type { NextRequest } from 'next/server'
import { and, eq, gt, ne } from 'drizzle-orm'
import { db } from '@/db'
import { authSessions } from '@/db/schema/auth-sessions'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { users } from '@/db/schema/users'
import { isUuid } from '@/lib/server/queries/public/uuid'

/** 존재를 확인할 관리자 상세 화면. */
export type AdminRouteIdentity = {
  resource: 'generations' | 'members' | 'parts' | 'projects' | 'sessions'
  id: string
}

const RESOURCES = new Set<AdminRouteIdentity['resource']>([
  'generations',
  'members',
  'parts',
  'projects',
  'sessions',
])

/** 상세 아래의 하위 화면. `create`처럼 id 자리에 오는 고정 경로는 상세가 아니다. */
const DETAIL_SUBPAGES = new Set(['edit', 'register'])
const FIXED_SEGMENTS = new Set(['create', 'accept'])

/**
 * 언어 접두사를 뗀 관리자 경로(`/admin/...`)가 상세 화면이면 리소스와 id를 돌려준다.
 * 목록·생성 화면이나 알 수 없는 하위 경로면 `null`.
 */
export function getAdminRouteIdentity(
  pathname: string
): AdminRouteIdentity | null {
  const [admin, resource, id, subpage, ...rest] = pathname
    .split('/')
    .filter(Boolean)

  if (
    admin !== 'admin' ||
    !resource ||
    !id ||
    rest.length > 0 ||
    FIXED_SEGMENTS.has(id) ||
    (subpage !== undefined && !DETAIL_SUBPAGES.has(subpage)) ||
    !RESOURCES.has(resource as AdminRouteIdentity['resource'])
  ) {
    return null
  }

  return {
    resource: resource as AdminRouteIdentity['resource'],
    id: decodeURIComponent(id),
  }
}

/** Better Auth 세션 쿠키(`<token>.<서명>`)에서 토큰을 꺼낸다. */
function sessionTokenFromRequest(request: NextRequest): string | null {
  const cookie =
    request.cookies.get('__Secure-better-auth.session_token') ??
    request.cookies.get('better-auth.session_token')
  const value = cookie?.value
  if (!value) return null

  const separator = value.lastIndexOf('.')
  return separator > 0 ? value.slice(0, separator) : null
}

/**
 * 요청에 승인된 사용자(UNVERIFIED가 아닌)의 유효한 로그인 세션이 있는지. 토큰은 DB의 세션과 정확히
 * 같아야 하므로 아무 쿠키 값이나 넣어서는 통과할 수 없다.
 */
export async function hasApprovedSession(
  request: NextRequest
): Promise<boolean> {
  const token = sessionTokenFromRequest(request)
  if (!token) return false

  const match = await db
    .select({ userId: authSessions.userId })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(
      and(
        eq(authSessions.token, token),
        gt(authSessions.expiresAt, new Date()),
        ne(users.role, 'UNVERIFIED')
      )
    )
    .limit(1)

  return match.length > 0
}

/** 관리자 상세 화면의 항목이 DB에 있는지. id 형식이 틀리면 조회 없이 `false`. */
export async function adminRouteExists({
  resource,
  id,
}: AdminRouteIdentity): Promise<boolean> {
  switch (resource) {
    case 'generations':
    case 'parts': {
      const numericId = Number(id)
      if (!/^\d+$/.test(id) || !Number.isSafeInteger(numericId)) return false
      const table = resource === 'parts' ? parts : generations
      const match = await db
        .select({ id: table.id })
        .from(table)
        .where(eq(table.id, numericId))
        .limit(1)
      return match.length > 0
    }
    case 'projects':
    case 'sessions': {
      if (!isUuid(id)) return false
      const table = resource === 'projects' ? projects : sessions
      const match = await db
        .select({ id: table.id })
        .from(table)
        .where(eq(table.id, id))
        .limit(1)
      return match.length > 0
    }
    case 'members': {
      const match = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)
      return match.length > 0
    }
  }
}
