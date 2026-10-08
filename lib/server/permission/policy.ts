// 표에 없는 조합은 거부한다. 기수 접근·CORE 대상 역할 제한은 services/admin/authorize.ts가 추가 검사한다.
import 'server-only'

import type { Role } from '@/db/schema/users'

export type ActionType = 'get' | 'post' | 'put' | 'delete'

// *Page는 화면 접근, 나머지는 쓰기 권한이다. publicCache는 전체 공개 캐시 새로고침 권한이다.
export type ResourceType =
  | 'members'
  | 'membersRole'
  | 'projects'
  | 'sessions'
  | 'generations'
  | 'parts'
  | 'publicCache'
  | 'adminPage'
  | 'membersPage'
  | 'profilePage'
  | 'projectsPage'
  | 'sessionsPage'
  | 'generationsPage'
  | 'partsPage'
  | 'announcements'
  | 'announcementsPage'

// true는 항상 허용, own은 요청자 ID와 데이터 소유자 ID가 같을 때만 허용한다.
type Rule = true | 'own'

type RolePolicy = Partial<
  Record<ActionType, Partial<Record<ResourceType, Rule>>>
>

const BASE_PAGES = {
  adminPage: true,
  profilePage: true,
  projectsPage: true,
  sessionsPage: true,
} as const

/** 역할별 허용 표. 키가 없는 작업은 거부된다. */
export const PERMISSION_POLICY: Record<Role, RolePolicy> = {
  MEMBER: {
    get: { ...BASE_PAGES },
    post: { members: 'own', projects: true },
    put: { members: 'own', projects: 'own' },
    delete: { members: 'own' },
  },
  CORE: {
    get: { ...BASE_PAGES, membersPage: true, partsPage: true },
    post: { members: true, projects: true, sessions: true, parts: true },
    put: {
      members: true,
      projects: true,
      sessions: true,
      parts: true,
      publicCache: true,
    },
    delete: { members: 'own', projects: true, sessions: true },
  },
  LEAD: {
    get: {
      ...BASE_PAGES,
      membersPage: true,
      generationsPage: true,
      partsPage: true,
      announcementsPage: true,
    },
    post: {
      members: true,
      membersRole: true,
      generations: true,
      projects: true,
      sessions: true,
      parts: true,
      announcements: true,
    },
    put: {
      members: true,
      membersRole: true,
      generations: true,
      projects: true,
      sessions: true,
      parts: true,
      publicCache: true,
    },
    delete: {
      members: true,
      membersRole: true,
      generations: true,
      projects: true,
      sessions: true,
      parts: true,
      announcements: true,
    },
  },
  ALUMNUS: {
    get: { ...BASE_PAGES },
    post: { members: 'own' },
    put: { members: 'own' },
  },
  UNVERIFIED: {},
}

// isOwner는 own 규칙에만 영향을 준다.
export function isAllowed(
  role: Role,
  action: ActionType,
  resource: ResourceType,
  { isOwner = false }: { isOwner?: boolean } = {}
): boolean {
  const rule = PERMISSION_POLICY[role][action]?.[resource]
  return rule === true || (rule === 'own' && isOwner)
}
