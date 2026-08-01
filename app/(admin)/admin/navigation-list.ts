import getUserRole from '@/lib/server/fetcher/admin/get-user-role'
import checkPermission from '@/lib/server/permission/check-permission'
import { ResourceType } from '@/lib/server/permission/handle-permission'
import { Locale } from '@/i18n-config'
import { getAdminMessages, localizeAdminHref } from '@/lib/admin-i18n'

/**
 * 네비게이션 항목을 식별하는 안정적인 키.
 * 아이콘 매핑(`nav-item.tsx`)과 React key에 사용되며, 로케일이나 라벨이 바뀌어도
 * 변하지 않습니다.
 */
export type NavigationKey =
  | 'home'
  | 'booking'
  | 'generations'
  | 'parts'
  | 'members'
  | 'sessions'
  | 'projects'
  | 'profile'

export interface NavigationItem {
  key: NavigationKey
  /** 순수 라벨. 아이콘은 렌더 단계에서 `key`로 매핑합니다. */
  name: string
  path: string
  dataResource: ResourceType | string
}

/**
 * 사이드 바 및 상단 바에서 표시할 관리자 페이지 목록
 */
export default async function getAdminNavigationItems(
  userId: string | undefined,
  locale: Locale
) {
  if (!userId) {
    return []
  }
  const userRole = await getUserRole(userId)
  const t = getAdminMessages(locale)
  const adminNavigationItems: NavigationItem[] = [
    {
      key: 'home',
      name: t.home,
      path: localizeAdminHref('/admin', locale),
      dataResource: 'adminPage',
    },
    {
      key: 'members',
      name: t.members,
      path: localizeAdminHref('/admin/members', locale),
      dataResource: 'membersPage',
    },
    {
      key: 'sessions',
      name: t.sessions,
      path: localizeAdminHref('/admin/sessions', locale),
      dataResource: 'sessionsPage',
    },
    {
      key: 'projects',
      name: t.projects,
      path: localizeAdminHref('/admin/projects', locale),
      dataResource: 'projectsPage',
    },
    {
      key: 'generations',
      name: t.generations,
      path: localizeAdminHref('/admin/generations', locale),
      dataResource: 'generationsPage',
    },
    {
      key: 'parts',
      name: t.parts,
      path: localizeAdminHref('/admin/parts', locale),
      dataResource: 'partsPage',
    },
    {
      key: 'booking',
      name: t.booking,
      path: localizeAdminHref('/admin/booking', locale),
      dataResource: 'bookingPage',
    },
    {
      key: 'profile',
      name: t.profile,
      path: localizeAdminHref('/admin/profile', locale),
      dataResource: 'profilePage',
    },
  ]

  return adminNavigationItems.filter(
    (item) =>
      checkPermission(userId)[userRole]?.get?.[item.dataResource] ?? false
  )
}
