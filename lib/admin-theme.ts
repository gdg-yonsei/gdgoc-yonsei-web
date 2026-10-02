/** 관리자 테마 쿠키 이름. */
export const ADMIN_THEME_COOKIE = 'admin-theme'

/** 관리자 테마. */
export type AdminTheme = 'light' | 'dark'

/** 값이 올바른 테마 이름인지. */
export function isAdminTheme(
  value: string | undefined | null
): value is AdminTheme {
  return value === 'light' || value === 'dark'
}

/** 쿠키 값을 테마로 바꾼다. 없거나 잘못된 값이면 라이트. */
export function normalizeAdminTheme(
  value: string | undefined | null
): AdminTheme {
  return isAdminTheme(value) ? value : 'light'
}
