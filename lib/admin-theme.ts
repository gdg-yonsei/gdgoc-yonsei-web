export const ADMIN_THEME_COOKIE = 'admin-theme'

export type AdminTheme = 'light' | 'dark'

export function isAdminTheme(
  value: string | undefined | null
): value is AdminTheme {
  return value === 'light' || value === 'dark'
}

export function normalizeAdminTheme(
  value: string | undefined | null
): AdminTheme {
  return isAdminTheme(value) ? value : 'light'
}
