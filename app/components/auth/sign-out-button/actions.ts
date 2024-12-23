'use server'

import { signOut } from '@/auth'

export default async function signOutAction() {
  await signOut()
}
