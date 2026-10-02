/**
 * 관리자 상세 화면의 "수정" 링크(서버 컴포넌트). 수정 권한이 있을 때만 보인다.
 */
import {
  hasPermission,
  ResourceType,
} from '@/lib/server/permission/has-permission'
import Link from 'next/link'
import type { AuthSession } from '@/auth'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

/**
 * 수정 권한이 있으면 수정 페이지 링크를 렌더링한다.
 *
 * 링크 표시 여부만 정하며, 실제 권한 검사는 수정 페이지와 서비스가 다시 한다.
 * @param session 현재 로그인 세션
 * @param dataOwnerId 항목 소유자 id(`'own'` 규칙이 있는 리소스에서 본인 여부 판단에 쓰임)
 * @param href 언어 접두사 없는 수정 페이지 경로
 * @param dataType 권한 리소스 종류
 * @param allowed 호출부가 이미 판단한 수정 가능 여부. 역할 표보다 세밀한 규칙(대상 역할, 기수)이 있을 때 넘기면 권한 조회를 건너뛴다.
 */
export default async function DataEditLink({
  session,
  dataOwnerId,
  href,
  dataType,
  allowed,
}: {
  session: AuthSession | null
  dataOwnerId?: string
  href: string
  dataType: ResourceType
  allowed?: boolean
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const canEdit =
    allowed ??
    (await hasPermission(session?.user?.id, 'put', dataType, dataOwnerId))

  return (
    <>
      {canEdit && (
        <Link
          href={localizeAdminHref(href, locale)}
          className={'admin-btn-secondary min-h-9 px-3'}
        >
          {t.edit}
        </Link>
      )}
    </>
  )
}
