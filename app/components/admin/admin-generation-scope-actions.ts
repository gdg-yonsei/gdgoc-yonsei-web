'use server'

import { cookies } from 'next/headers'
import { auth } from '@/auth'
import {
  ADMIN_GENERATION_SCOPE_COOKIE,
  normalizeAdminGenerationScopeValueForUser,
} from '@/lib/server/admin-generation-scope'

export async function setAdminGenerationScopeAction(nextValue: string) {
  const session = await auth()
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
    sameSite: 'lax',
  })
}
