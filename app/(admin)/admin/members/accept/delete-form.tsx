'use client'

import DataForm from '@/app/components/data-form'
import { deleteUserAction } from '@/app/(admin)/admin/members/accept/actions'
import SubmitButton from '@/app/components/admin/submit-button'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export default function DeleteForm({ userId }: { userId: string }) {
  const { t } = useAdminI18n()
  return (
    <DataForm action={deleteUserAction}>
      <input hidden={true} name={'userId'} value={userId} readOnly={true} />
      <SubmitButton className={'admin-btn-danger min-h-9 px-3'}>
        {t('delete')}
      </SubmitButton>
    </DataForm>
  )
}
