import getUserRole from '@/lib/admin/get-user-role'
import checkPermission from '@/lib/admin/check-permission'

export interface NavigationItem {
  name: string
  path: string
  dataResource: string
}

/**
 * 사이드 바 및 상단 바에서 표시할 관리자 페이지 목록
 */
export default async function navigationList(userId: string | undefined) {
  if (!userId) {
    return []
  }
  const userRole = await getUserRole(userId)
  const navigations = [
    {
      name: 'Home',
      path: '/admin',
      dataResource: 'adminPage',
    },
    {
      name: 'Members',
      path: '/admin/members',
      dataResource: 'membersPage',
    },
    {
      name: 'Sessions',
      path: '/admin/sessions',
      dataResource: 'sessionsPage',
    },
    {
      name: 'Projects',
      path: '/admin/projects',
      dataResource: 'projectsPage',
    },
    {
      name: 'Profile',
      path: '/admin/profile',
      dataResource: 'profilePage',
    },
  ]

  return navigations.filter(
    (item) => checkPermission(userId)[userRole].get[item.dataResource]
  )
}
