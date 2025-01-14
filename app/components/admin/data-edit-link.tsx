import handlePermission, { ResourceType } from '@/lib/admin/handle-permission'
import Link from 'next/link'
import { Session } from 'next-auth'

/**
 * 데이터 수정 Link 컴포넌트
 *
 * 사용자가 수정 권한이 있으면 네비게이션 버튼을 보여줌
 * @param session - 사용자 session
 * @param dataId - 수정하는 data id
 * @param href - 수정 페이지 링크
 * @param dataType - 수정하는 데이터 종류
 * @constructor
 */
export default async function DataEditLink({
  session,
  dataId,
  href,
  dataType,
}: {
  session: Session | null
  dataId: string
  href: string
  dataType: ResourceType
}) {
  // 사용자가 수정할 수 있는지 확인
  const canEdit = await handlePermission(
    session?.user?.id,
    'put',
    dataType,
    dataId
  )

  return (
    <>
      {canEdit && (
        <Link
          href={href}
          className={
            'p-1 rounded-lg px-3 hover:px-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-all'
          }
        >
          Edit
        </Link>
      )}
    </>
  )
}
