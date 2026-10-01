'use server'

import { auth } from '@/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/** 현재 세션을 끝내고 로그인 화면으로 이동한다. */
export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/auth/sign-in')
}
