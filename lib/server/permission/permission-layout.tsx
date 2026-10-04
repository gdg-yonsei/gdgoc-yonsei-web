/**
 * 관리자 화면의 경계 레이아웃을 만드는 팩토리.
 *
 * 관리자 라우트의 `layout.tsx` 대부분은 권한 한 줄만 확인하거나 동적 `[id]` 구간을 요청 시점 렌더링으로
 * 고정하는 일만 한다. 그런 레이아웃은 이 팩토리로 한 줄에 선언한다(`export default permissionLayout(...)`).
 * 데이터를 읽어 권한을 정하는 레이아웃(예: 프로젝트 수정의 작성자 확인)은 직접 작성한다.
 * 권한 표는 `lib/server/permission/policy.ts`에 있다.
 */
import 'server-only'

import type { ReactNode } from 'react'
import { connection } from 'next/server'
import type {
  ActionType,
  ResourceType,
} from '@/lib/server/permission/has-permission'
import {
  requireOwnPermission,
  requirePermission,
} from '@/lib/server/permission/require-permission'

type BoundaryLayoutProps = { children: ReactNode }

/**
 * `resource`에 `action` 권한이 없으면 403(`forbidden()`)으로 멈추는 레이아웃.
 *
 * @param options.own 로그인한 사용자 자신의 데이터(내 프로필 등)에 대한 권한으로 확인한다.
 */
export function permissionLayout(
  action: ActionType,
  resource: ResourceType,
  options: { own?: boolean } = {}
) {
  async function PermissionLayout({ children }: BoundaryLayoutProps) {
    if (options.own) {
      await requireOwnPermission(action, resource)
    } else {
      await requirePermission(action, resource)
    }

    return children
  }

  return PermissionLayout
}

/**
 * 동적 `[id]` 구간(상세·수정)을 요청 시점 렌더링으로 고정하는 레이아웃. 관리자 데이터는 사용자·권한마다
 * 다르므로 빌드 시 미리 렌더링하지 않는다. 하위 레이아웃(수정 화면 등)은 이 구간 안에서 렌더링되므로
 * `connection()`을 다시 부르지 않는다.
 */
export function requestTimeLayout() {
  async function RequestTimeLayout({ children }: BoundaryLayoutProps) {
    await connection()

    return children
  }

  return RequestTimeLayout
}
