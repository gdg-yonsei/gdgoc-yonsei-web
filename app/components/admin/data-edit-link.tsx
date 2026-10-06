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

/** 실제 수정 권한은 페이지·서비스가 다시 검증하며, allowed가 있으면 호출부의 세밀한 판단을 사용한다.
 * dataOwnerId는 own 규칙에 쓰이고, href에는 언어 접두사를 붙이지 않는다. */
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
