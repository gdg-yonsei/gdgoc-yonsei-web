/**
 * 관리자 상세 화면의 공용 삭제 버튼(서버 컴포넌트).
 *
 * 삭제 권한이 없으면 아무것도 렌더링하지 않는다. 버튼 표시 여부만 여기서 정하고,
 * 실제 권한 검사는 삭제 서비스가 다시 한다.
 */
import type { AuthSession } from '@/auth'
import {
  hasPermission,
  ResourceType,
} from '@/lib/server/permission/has-permission'
import { deleteResourceAction } from '@/app/components/admin/data-delete-button/actions'
import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/data-delete-button/submit-button'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/**
 * 권한이 있을 때만 확인 모달이 붙은 삭제 폼을 렌더링한다.
 *
 * @param session 현재 로그인 세션
 * @param dataType 삭제할 리소스 종류(권한 리소스 이름과 같음)
 * @param dataId 삭제할 항목 id
 */
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
