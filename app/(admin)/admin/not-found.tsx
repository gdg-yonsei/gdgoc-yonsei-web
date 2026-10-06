/** 전역 404는 별도 html 문서지만, 관리자 내부 404는 관리자 셸 안의 본문만 그린다. */
import Link from 'next/link'
import AdminEmptyState from '@/app/components/admin/empty-state'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

export default async function AdminNotFound() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)

  return (
    <AdminEmptyState
      title={t.notFoundTitle}
      description={t.notFoundHint}
      action={
        <Link
          href={localizeAdminHref('/admin', locale)}
          className={'admin-btn-primary'}
        >
          {t.backToDashboard}
        </Link>
      }
    />
  )
}
