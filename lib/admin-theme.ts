export const ADMIN_THEME_COOKIE = 'admin-theme'

export type AdminTheme = 'light' | 'dark'

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
