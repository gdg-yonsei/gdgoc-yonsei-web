/**
 * 관리자 메뉴 목록(서버 전용). 사이드바·드로어·하단 탭이 같은 목록을 쓴다.
 *
 * 각 메뉴는 페이지 리소스(`*Page`)와 연결되어, 사용자 역할로 `get` 권한이 있는 메뉴만 남긴다.
 */
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import { isAllowed, type ResourceType } from '@/lib/server/permission/policy'
import type { Locale } from '@/lib/i18n'
import { getAdminMessages, localizeAdminHref } from '@/lib/admin-i18n'

/**
 * 메뉴 항목을 식별하는 고정 키.
 * 아이콘 표(`nav-item.tsx`)와 React key에 쓰며, 언어나 라벨이 바뀌어도 변하지 않는다.
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

/** 메뉴 항목 하나. */
export interface NavigationItem {
  key: NavigationKey
  /** 라벨 문자열. 아이콘은 렌더링할 때 `key`로 찾는다. */
  name: string
  path: string
  dataResource: ResourceType
}

/**
 * 사용자가 볼 수 있는 관리자 메뉴 목록. 로그인하지 않았으면 빈 배열.
 * @param userId 로그인 사용자 id
 * @param locale 라벨과 링크에 쓸 관리자 언어
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

  return adminNavigationItems.filter((item) =>
    isAllowed(userRole, 'get', item.dataResource)
  )
}
