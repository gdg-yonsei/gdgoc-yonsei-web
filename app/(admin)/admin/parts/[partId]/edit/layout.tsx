/**
 * 파트 수정 화면의 권한 경계(서버 레이아웃). `parts` 리소스에 `put` 권한이 없으면 403(`forbidden()`).
 *
 * `connection()`으로 이 구간을 요청 시점 렌더링으로 고정한다. 관리자 데이터는 사용자·권한마다
 * 다르므로 빌드 시 미리 렌더링하지 않는다.
 * 권한 표는 `lib/server/permission/policy.ts`에 있다.
 */
import { ReactNode } from 'react'
import { connection } from 'next/server'
import { requirePermission } from '@/lib/server/permission/require-permission'

/** 권한을 확인한 뒤 하위 페이지를 그대로 렌더링한다. */
export default async function EditPartLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()
  await requirePermission('put', 'parts')

  return <>{children}</>
}
