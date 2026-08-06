import { ReactNode } from 'react'
import { requireOwnPermission } from '@/lib/server/permission/require-permission'

export default async function EditProfileLayout({
  children,
}: {
  children: ReactNode
}) {
  // 본인 프로필이므로 데이터 소유자는 로그인한 사용자 자신이다.
  await requireOwnPermission('put', 'members')

  return <>{children}</>
}
