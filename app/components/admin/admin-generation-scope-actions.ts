'use server'

/** 쿠키의 기수 범위는 서버가 권한으로 재검증해 접근 불가 기수를 막는다. */
import { cookies } from 'next/headers'
import { getAuthSession } from '@/auth'
import {
  ADMIN_GENERATION_SCOPE_COOKIE,
  normalizeAdminGenerationScopeValueForUser,
} from '@/lib/server/admin-generation-scope'

/** 미로그인은 변경하지 않고, 접근 불가 값은 쿠키를 지워 기본 범위로 돌아간다.
 * 호출부는 router.refresh()로 화면을 다시 받아야 한다. */
export async function setAdminGenerationScopeAction(nextValue: string) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return
  }

  const cookieStore = await cookies()
  const normalizedValue = await normalizeAdminGenerationScopeValueForUser(
    session.user.id,
    nextValue
  )

  if (!normalizedValue) {
    cookieStore.delete(ADMIN_GENERATION_SCOPE_COOKIE)
    return
  }

  cookieStore.set(ADMIN_GENERATION_SCOPE_COOKIE, normalizedValue, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
