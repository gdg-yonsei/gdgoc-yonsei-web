// 작성자 등 데이터로 권한을 정하는 레이아웃은 이 팩토리 대신 직접 작성한다.
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

// own은 로그인한 사용자 자신의 데이터에 대한 권한으로 확인한다.
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

// 사용자·권한별 관리자 상세는 요청 시 렌더링한다. 하위 레이아웃은 connection을 다시 부르지 않는다.
export function requestTimeLayout() {
  async function RequestTimeLayout({ children }: BoundaryLayoutProps) {
    await connection()

    return children
  }

  return RequestTimeLayout
}
