/**
 * 역할(Role)별 권한 정책 표.
 *
 * GYMS(관리자 시스템)의 모든 권한 판단은 이 표 하나를 기준으로 한다.
 * - 웹: `hasPermission`/`requirePermission`(레이아웃·페이지 가드, 버튼 노출)
 * - 서비스: `authorize`(웹 Server Action과 MCP 도구가 함께 쓰는 쓰기 권한)
 * - 메뉴: 관리자 내비게이션 항목 노출
 *
 * 표에 없는 조합은 모두 거부한다. 기수 단위 접근 제한(본인 기수만)과 대상 역할
 * 제한(CORE는 낮은 역할만 수정)은 표로 표현할 수 없어 `services/admin/authorize.ts`가
 * 추가로 확인한다.
 */
import 'server-only'

import type { Role } from '@/db/schema/users'

/** 권한 검사 대상 작업. 조회(`get`)와 쓰기(`post`/`put`/`delete`)로 나뉜다. */
export type ActionType = 'get' | 'post' | 'put' | 'delete'

/**
 * 권한 검사 대상 리소스.
 * `*Page`는 관리자 화면 접근, 나머지는 데이터 쓰기 권한이다.
 * `publicCache`는 공개 사이트 전체 캐시 새로고침(`put`) 권한이다.
 */
export type ResourceType =
  | 'members'
  | 'membersRole'
  | 'projects'
  | 'sessions'
  | 'generations'
  | 'parts'
  | 'booking'
  | 'publicCache'
  | 'adminPage'
  | 'membersPage'
  | 'profilePage'
  | 'projectsPage'
  | 'sessionsPage'
  | 'generationsPage'
  | 'partsPage'
  | 'bookingPage'

/**
 * 허용 규칙.
 * - `true`: 항상 허용
 * - `'own'`: 본인 데이터(요청자 ID === 데이터 소유자 ID)일 때만 허용
 */
type Rule = true | 'own'

type RolePolicy = Partial<
  Record<ActionType, Partial<Record<ResourceType, Rule>>>
>

/** 모든 역할이 공통으로 볼 수 있는 관리자 화면. */
const BASE_PAGES = {
  adminPage: true,
  profilePage: true,
  projectsPage: true,
  sessionsPage: true,
} as const

/** 역할별 허용 표. 키가 없는 작업은 거부된다. */
export const PERMISSION_POLICY: Record<Role, RolePolicy> = {
  /** 일반 멤버: 본인 프로필과 프로젝트 위주. */
  MEMBER: {
    get: { ...BASE_PAGES },
    post: { members: 'own', projects: true },
    put: { members: 'own', projects: 'own' },
    delete: { members: 'own' },
  },
  /** 코어 멤버: 멤버·파트·세션·프로젝트 운영. 기수 관리와 역할 변경은 불가. */
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
  /** 리드: 모든 작업 허용. */
  LEAD: {
    get: {
      ...BASE_PAGES,
      membersPage: true,
      generationsPage: true,
      partsPage: true,
      bookingPage: true,
    },
    post: {
      members: true,
      membersRole: true,
      generations: true,
      projects: true,
      sessions: true,
      parts: true,
      booking: true,
    },
    put: {
      members: true,
      membersRole: true,
      generations: true,
      projects: true,
      sessions: true,
      parts: true,
      booking: true,
      publicCache: true,
    },
    delete: {
      members: true,
      membersRole: true,
      generations: true,
      projects: true,
      sessions: true,
      parts: true,
      booking: true,
    },
  },
  /** 졸업생: 조회와 본인 프로필 수정만. */
  ALUMNUS: {
    get: { ...BASE_PAGES },
    post: { members: 'own' },
    put: { members: 'own' },
  },
  /** 가입 승인 전 사용자: 아무 권한도 없다. */
  UNVERIFIED: {},
}

/**
 * 역할이 해당 작업을 할 수 있는지 판단한다.
 *
 * @param isOwner - 요청자가 대상 데이터의 소유자인지. `'own'` 규칙에만 영향을 준다.
 */
export function isAllowed(
  role: Role,
  action: ActionType,
  resource: ResourceType,
  { isOwner = false }: { isOwner?: boolean } = {}
): boolean {
  const rule = PERMISSION_POLICY[role][action]?.[resource]
  return rule === true || (rule === 'own' && isOwner)
}
