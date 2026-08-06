import { Session } from 'next-auth'
import handlePermission, {
  ResourceType,
} from '@/lib/server/permission/handle-permission'
import deleteResourceAction from '@/app/components/admin/data-delete-button/actions'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/data-delete-button/submit-button'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

export default async function DataDeleteButton({
  session,
  dataType,
  dataId,
}: {
  session: Session | null
  dataType: ResourceType
  dataId: string
}) {
  const t = getAdminMessages(await getAdminLocale())
  const canDelete = await handlePermission(
    session?.user?.id,
    'delete',
    dataType
  )

  return (
    <>
      {canDelete && (
        <DataForm action={deleteResourceAction}>
          <input hidden={true} value={dataId} name={'dataId'} readOnly={true} />
          <input
            hidden={true}
            value={dataType}
            name={'dataType'}
            readOnly={true}
          />
          <SubmitButton
            className={'admin-btn-danger min-h-9 px-3'}
            questionText={t.deleteConfirm}
          >
            {t.delete}
          </SubmitButton>
        </DataForm>
      )}
    </>
  )
}
