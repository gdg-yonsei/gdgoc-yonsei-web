import 'server-only'

import { forbidden } from 'next/navigation'
import { getAuthSession } from '@/auth'
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import type { Actor, ServiceFailure } from '@/lib/server/services/admin/types'

/** 웹 세션 사용자를 Actor 로. 웹 세션은 OAuth 스코프 제한이 없다. */
export async function getWebActor(): Promise<Actor | null> {
  const session = await getAuthSession()
  const userId = session?.user?.id
  if (!userId) return null

  return {
    userId,
    role: await getUserRole(userId),
    scopes: 'session',
    via: 'web',
  }
}

/** Server Action 용: 권한 실패는 forbidden(), 그 외는 폼 오류 문구로. */
export function toActionError(failure: ServiceFailure): { error: string } {
  if (failure.code === 'FORBIDDEN' || failure.code === 'UNAUTHORIZED') {
    return forbidden()
  }
  return { error: failure.message }
}
