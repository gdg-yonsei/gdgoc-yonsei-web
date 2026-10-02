/**
 * 사이드바의 공개 캐시 새로고침 버튼(서버 컴포넌트).
 */
import Form from 'next/form'
import { getAuthSession } from '@/auth'
import { revalidateAllDataAction } from '@/app/components/admin/refresh-all-data-button/actions'
import RefreshDataSubmitButton from '@/app/components/admin/refresh-all-data-button/button'
import { hasPermission } from '@/lib/server/permission/has-permission'

/**
 * 공개 사이트 목록 캐시 새로고침 버튼(사이드바). 상세 페이지 캐시는 지우지 않는다(`actions.ts` 참고).
 * 새로고침 권한(CORE·LEAD)이 있을 때만 보인다. 세션·역할 조회는 요청 단위로 캐시된다.
 */
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
