'use client'

/**
 * 가입 거절(계정 삭제) 폼(클라이언트 컴포넌트).
 */
import DataForm from '@/app/components/admin/data-form'
import { deleteMemberAction } from '@/app/(admin)/admin/members/accept/actions'
import SubmitButton from '@/app/components/admin/submit-button'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 거절 버튼. 누르면 사용자 계정을 삭제한다.
 *
 * @param userId 거절할 사용자 id
 */
export default function DeleteForm({ userId }: { userId: string }) {
  const { t } = useAdminI18n()
  return (
    <DataForm action={deleteMemberAction}>
      <input hidden={true} name={'userId'} value={userId} readOnly={true} />
      <SubmitButton className={'admin-btn-danger min-h-9 px-3'}>
        {t('delete')}
      </SubmitButton>
    </DataForm>
  )
}
