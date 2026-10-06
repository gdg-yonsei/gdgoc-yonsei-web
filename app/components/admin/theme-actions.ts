'use server'

import { cookies } from 'next/headers'
import {
  ADMIN_THEME_COOKIE,
  normalizeAdminTheme,
  type AdminTheme,
} from '@/lib/admin-theme'

/** 서버가 테마 쿠키로 클래스를 정해 초기 깜빡임을 피한다.
 * 테마는 민감한 값이 아니어서 클라이언트가 읽을 수 있게 httpOnly를 쓰지 않는다. */
export async function setAdminThemeAction(nextTheme: AdminTheme) {
  const theme = normalizeAdminTheme(nextTheme)
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_THEME_COOKIE, theme, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === 'production',
  })

  return theme
}
