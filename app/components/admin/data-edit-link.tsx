import handlePermission, { ResourceType } from '@/lib/admin/handle-permission'
import Link from 'next/link'
import { Session } from 'next-auth'

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
