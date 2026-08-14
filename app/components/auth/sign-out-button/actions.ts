'use server'

import { auth } from '@/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * 로그아웃 액션
 */
export default async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/auth/sign-in')
}
