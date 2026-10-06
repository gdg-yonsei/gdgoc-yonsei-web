// 스트리밍 중 notFound는 200을 보낼 수 있어 proxy가 없는 항목을 전역 404로 rewrite한다.
// 로그인·승인 전에는 검사하지 않아 로그인 없이 ID 존재 여부가 드러나지 않게 한다.
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

// 목록·생성 화면이나 알 수 없는 하위 경로는 상세 화면으로 해석하지 않는다.
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

// 승인된 사용자의 유효 세션만 허용한다. 쿠키 토큰은 DB 세션 토큰과 정확히 같아야 한다.
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
