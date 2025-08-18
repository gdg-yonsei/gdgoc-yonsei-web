import { Session } from 'next-auth'
import handlePermission, {
  ResourceType,
} from '@/lib/server/permission/handle-permission'
import dataDeleteAction from '@/app/components/admin/data-delete-button/actions'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/data-delete-button/submit-button'

export default async function DataDeleteButton({
  session,
  dataType,
  dataId,
}: {
  session: Session | null
  dataType: ResourceType
  dataId: string
}) {
  const canDelete = await handlePermission(
    session?.user?.id,
    'delete',
    dataType
  )

  return (
    <>
      {canDelete && (
        <DataForm action={dataDeleteAction}>
          <input hidden={true} value={dataId} name={'dataId'} readOnly={true} />
          <input
            hidden={true}
            value={dataType}
            name={'dataType'}
            readOnly={true}
          />
          <SubmitButton
            className={
              'flex items-center gap-2 rounded-lg bg-red-600 p-1 px-3 text-white transition-all hover:bg-red-500 hover:px-4'
            }
            questionText={'Are you sure you want to delete this data?'}
          >
            Delete
          </SubmitButton>
        </DataForm>
      )}
    </>
  )
}
