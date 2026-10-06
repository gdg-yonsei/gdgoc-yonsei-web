import type { AuthSession } from '@/auth'
import {
  hasPermission,
  ResourceType,
} from '@/lib/server/permission/has-permission'
import { deleteResourceAction } from '@/app/components/admin/data-delete-button/actions'
import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/data-delete-button/submit-button'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/** 여기서는 삭제 버튼 표시만 정하고, 실제 권한은 삭제 서비스가 다시 검증한다. */
export default async function DataDeleteButton({
  session,
  dataType,
  dataId,
}: {
  session: AuthSession | null
  dataType: ResourceType
  dataId: string
}) {
  const t = getAdminMessages(await getAdminLocale())
  const canDelete = await hasPermission(session?.user?.id, 'delete', dataType)

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
