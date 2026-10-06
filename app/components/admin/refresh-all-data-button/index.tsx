import Form from 'next/form'
import { getAuthSession } from '@/auth'
import { revalidateAllDataAction } from '@/app/components/admin/refresh-all-data-button/actions'
import RefreshDataSubmitButton from '@/app/components/admin/refresh-all-data-button/button'
import { hasPermission } from '@/lib/server/permission/has-permission'

/** CORE·LEAD만 갱신 버튼을 보며, 세션·역할 조회는 요청마다 공유한다.
 * 목록은 즉시, 상세는 다음 방문 때 백그라운드 갱신한다. */
export default async function RefreshAllDataButton() {
  const session = await getAuthSession()
  if (!(await hasPermission(session?.user?.id, 'put', 'publicCache'))) {
    return null
  }

  return (
    <Form action={revalidateAllDataAction}>
      <RefreshDataSubmitButton />
    </Form>
  )
}
