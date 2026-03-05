import getUserRole from '@/lib/server/fetcher/admin/get-user-role'
import checkPermission from '@/lib/server/permission/check-permission'
import { ResourceType } from '@/lib/server/permission/handle-permission'
import { Locale } from '@/i18n-config'
import {
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n'

export interface NavigationItem {
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
  const adminNavigationItems = [
    {
      name: `🏠 ${t.home}`,
      path: localizeAdminHref('/admin', locale),
      dataResource: 'adminPage',
    },
    {
      name: `🗓️ ${t.generations}`,
      path: localizeAdminHref('/admin/generations', locale),
      dataResource: 'generationsPage',
    },
    {
      name: `💻 ${t.parts}`,
      path: localizeAdminHref('/admin/parts', locale),
      dataResource: 'partsPage',
    },
    {
      name: `👥 ${t.members}`,
      path: localizeAdminHref('/admin/members', locale),
      dataResource: 'membersPage',
    },
    {
      name: `📚 ${t.sessions}`,
      path: localizeAdminHref('/admin/sessions', locale),
      dataResource: 'sessionsPage',
    },
    {
      name: `📝 ${t.projects}`,
      path: localizeAdminHref('/admin/projects', locale),
      dataResource: 'projectsPage',
    },
    {
      name: `🧑‍💻 ${t.profile}`,
      path: localizeAdminHref('/admin/profile', locale),
      dataResource: 'profilePage',
    },
  ]

  return adminNavigationItems.filter(
    (item) => checkPermission(userId)[userRole].get[item.dataResource]
  )
}
