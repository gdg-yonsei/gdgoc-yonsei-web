'use server'

import { cookies } from 'next/headers'
import {
  ADMIN_THEME_COOKIE,
  normalizeAdminTheme,
  type AdminTheme,
} from '@/lib/admin-theme'

/**
 * 관리자 테마를 쿠키에 저장합니다.
 *
 * 로케일 · 기수 스코프와 동일하게 서버가 쿠키를 읽어 `<html>` 클래스를 결정하므로
 * 클라이언트 부트스트랩 스크립트 없이도 FOUC가 발생하지 않습니다.
 * `httpOnly`는 쓰지 않습니다 — 민감한 값이 아니고, 추후 클라이언트에서 시스템
 * 테마 동기화를 붙일 여지를 남겨둡니다.
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
