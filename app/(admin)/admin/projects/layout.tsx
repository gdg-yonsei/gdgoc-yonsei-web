/**
 * 프로젝트 관리 영역(목록·상세·생성·수정 전체)의 권한 경계(서버 레이아웃). `projectsPage` 리소스에 `get` 권한이 없으면 403(`forbidden()`).
 * 권한 표는 `lib/server/permission/policy.ts`에 있다.
 */
import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

/** 권한을 확인한 뒤 하위 페이지를 그대로 렌더링한다. */
export default async function ProjectsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'projectsPage')

  return <>{children}</>
}
