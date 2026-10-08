/** 사이드바·드로어·하단 탭은 같은 메뉴 목록을 쓰며, 역할에 `get` 권한이 있는 페이지 메뉴만 남긴다. */
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import { isAllowed, type ResourceType } from '@/lib/server/permission/policy'
import type { Locale } from '@/lib/i18n'
import { getAdminMessages, localizeAdminHref } from '@/lib/admin-i18n'

/** 언어·라벨이 바뀌어도 같은 아이콘과 React key를 쓰는 고정 키다. */
export type NavigationKey =
  | 'home'
  | 'generations'
  | 'parts'
  | 'members'
  | 'sessions'
  | 'projects'
  | 'announcements'
  | 'profile'

export interface NavigationItem {
  key: NavigationKey

  name: string
  path: string
  dataResource: ResourceType
}

/** 로그인하지 않았으면 빈 메뉴 목록을 반환한다. */
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
      key: 'announcements',
      name: t.announcements,
      path: localizeAdminHref('/admin/announcements', locale),
      dataResource: 'announcementsPage',
    },
    {
      key: 'profile',
      name: t.profile,
      path: localizeAdminHref('/admin/profile', locale),
      dataResource: 'profilePage',
    },
  ]

  return adminNavigationItems.filter((item) =>
    isAllowed(userRole, 'get', item.dataResource)
  )
}
