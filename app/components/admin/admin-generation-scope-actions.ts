'use server'

import { cookies } from 'next/headers'
import { getAuthSession } from '@/auth'
import {
  ADMIN_GENERATION_SCOPE_COOKIE,
  normalizeAdminGenerationScopeValueForUser,
} from '@/lib/server/admin-generation-scope'

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
