'use server'

/**
 * 관리자 라이트/다크 테마 쿠키를 저장하는 Server Action.
 */
import { cookies } from 'next/headers'
import {
  ADMIN_THEME_COOKIE,
  normalizeAdminTheme,
  type AdminTheme,
} from '@/lib/admin-theme'

/**
 * 관리자 테마를 쿠키에 저장하고 정규화된 값을 돌려준다.
 *
 * 언어·기수 범위와 마찬가지로 서버가 쿠키를 읽어 테마 클래스를 정하므로, 클라이언트
 * 초기화 스크립트 없이도 깜빡임(FOUC)이 생기지 않는다.
 * `httpOnly`는 쓰지 않는다. 민감한 값이 아니고, 나중에 클라이언트에서 시스템 테마와
 * 동기화할 여지를 남겨 둔다.
 */
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
