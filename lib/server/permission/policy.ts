// 표에 없는 조합은 거부한다. 소유자·기수 범위 조건도 표의 규칙 값으로 선언하고,
// 조건에 필요한 정보(소유자, 기수)가 없으면 거부한다(fail closed).
// 멤버 수정의 대상 역할 제한만 services/admin/authorize.ts가 추가 검사한다.
import 'server-only'

import type { Role } from '@/db/schema/users'

export type ActionType = 'get' | 'post' | 'put' | 'delete'

// *Page는 화면 접근, 나머지는 데이터 권한이다. publicCache는 전체 공개 캐시 새로고침 권한이다.
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
  | 'analyticsPage'

/**
 * 규칙 값.
 * - `true`: 항상 허용
 * - `own`: 요청자가 데이터 소유자(작성자·본인)일 때만
 * - `generation`: 대상이 요청자가 속한 기수의 데이터일 때만
 * - `ownOrGeneration`: 소유자이거나, 요청자가 속한 기수의 데이터일 때
 */
export type Rule = true | 'own' | 'generation' | 'ownOrGeneration'

/**
 * 규칙의 조건을 판정할 때 쓰는 사실. 값이 없으면(`undefined`) 그 조건은 충족되지 않은 것으로 본다.
 * 그래서 기수 범위 규칙을 기수 정보 없이 평가하면 항상 거부된다.
 */
export type AccessContext = {
  isOwner?: boolean | undefined
  inGeneration?: boolean | undefined
}

type RolePolicy = Partial<
  Record<ActionType, Partial<Record<ResourceType, Rule>>>
>

const BASE_PAGES = {
  adminPage: true,
  profilePage: true,
  projectsPage: true,
  sessionsPage: true,
  analyticsPage: true,
} as const

/** 역할별 허용 표. 키가 없는 작업은 거부된다. LEAD만 기수와 무관하게 모든 데이터를 다룬다. */
export const PERMISSION_POLICY: Record<Role, RolePolicy> = {
  MEMBER: {
    get: { ...BASE_PAGES, generations: 'generation' },
    post: { members: 'own', projects: 'generation' },
    put: { members: 'own', projects: 'own' },
    delete: { members: 'own' },
  },
  CORE: {
    get: {
      ...BASE_PAGES,
      membersPage: true,
      partsPage: true,
      generations: 'generation',
      parts: 'generation',
    },
    post: {
      members: true,
      projects: 'generation',
      sessions: 'generation',
      parts: 'generation',
    },
    put: {
      members: 'ownOrGeneration',
      projects: 'ownOrGeneration',
      sessions: 'ownOrGeneration',
      parts: 'generation',
      publicCache: true,
    },
    delete: {
      members: 'own',
      projects: 'generation',
      sessions: 'generation',
    },
  },
  LEAD: {
    get: {
      ...BASE_PAGES,
      membersPage: true,
      generationsPage: true,
      partsPage: true,
      announcementsPage: true,
      generations: true,
      parts: true,
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
    get: { ...BASE_PAGES, generations: 'generation' },
    post: { members: 'own' },
    put: { members: 'own' },
  },
  UNVERIFIED: {},
}

/** 역할·작업·리소스에 선언된 규칙. 선언이 없으면 `undefined`(거부). */
export function ruleFor(
  role: Role,
  action: ActionType,
  resource: ResourceType
): Rule | undefined {
  return PERMISSION_POLICY[role][action]?.[resource]
}

/** 규칙을 판정하는 데 기수 정보가 필요한지. */
export function ruleNeedsGeneration(rule: Rule | undefined): boolean {
  return rule === 'generation' || rule === 'ownOrGeneration'
}

/** 규칙과 사실로 허용 여부를 판정한다. 필요한 사실이 없으면 거부한다. */
export function evaluateRule(
  rule: Rule | undefined,
  { isOwner, inGeneration }: AccessContext = {}
): boolean {
  switch (rule) {
    case true:
      return true
    case 'own':
      return isOwner === true
    case 'generation':
      return inGeneration === true
    case 'ownOrGeneration':
      return isOwner === true || inGeneration === true
    default:
      return false
  }
}

// 소유자·기수 조건은 호출자가 넘긴 사실로만 충족된다. 넘기지 않으면 조건부 규칙은 거부된다.
export function isAllowed(
  role: Role,
  action: ActionType,
  resource: ResourceType,
  context: AccessContext = {}
): boolean {
  return evaluateRule(ruleFor(role, action, resource), context)
}

/** 조건(소유자·기수)이 모두 충족된다고 가정했을 때 역할상 가능한지. 메뉴·도구 노출용. */
export function isEverAllowed(
  role: Role,
  action: ActionType,
  resource: ResourceType
): boolean {
  return ruleFor(role, action, resource) !== undefined
}
