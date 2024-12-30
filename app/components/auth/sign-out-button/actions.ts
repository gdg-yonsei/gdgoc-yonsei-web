'use server'

import { signOut } from '@/auth'

/**
 * 로그아웃 액션
 */
export default async function signOutAction() {
  await signOut()
}
