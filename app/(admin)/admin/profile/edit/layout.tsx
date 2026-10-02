/**
 * 내 프로필 수정 화면의 권한 경계(서버 레이아웃). 본인 데이터에 대한 `members` `put` 권한이 없으면 403.
 * 권한 표는 `lib/server/permission/policy.ts`에 있다.
 */
import { ReactNode } from 'react'
import { requireOwnPermission } from '@/lib/server/permission/require-permission'

/** 권한을 확인한 뒤 하위 페이지를 그대로 렌더링한다. */
export default async function EditProfileLayout({
  children,
}: {
  children: ReactNode
}) {
  // 본인 프로필이므로 데이터 소유자는 로그인한 사용자 자신이다.
  await requireOwnPermission('put', 'members')

  return <>{children}</>
}
