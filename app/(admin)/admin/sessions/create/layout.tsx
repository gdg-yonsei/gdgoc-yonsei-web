/**
 * 세션 생성 화면의 권한 경계(서버 레이아웃). `sessions` 리소스에 `post` 권한이 없으면 403(`forbidden()`).
 * 권한 표는 `lib/server/permission/policy.ts`에 있다.
 */
import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

/** 권한을 확인한 뒤 하위 페이지를 그대로 렌더링한다. */
export default async function CreateSessionLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('post', 'sessions')

  return <>{children}</>
}
