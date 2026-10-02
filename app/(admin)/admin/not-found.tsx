/**
 * 관리자 화면의 404(서버 컴포넌트). 관리자 페이지에서 `notFound()`를 부르면 Next가 이 파일을 렌더링한다.
 *
 * 이 파일이 없으면 가장 가까운 not-found가 `app/not-found.tsx`가 되는데, 그 파일은 루트 레이아웃이 여러 개라
 * `<html>`부터 그리는 문서다. 그러면 관리자 루트 레이아웃 안에 `<html>`이 한 번 더 들어가 hydration 오류가
 * 난다. 여기서는 관리자 셸(사이드바·앱 바) 안의 본문만 그린다.
 */
import Link from 'next/link'
import AdminEmptyState from '@/app/components/admin/empty-state'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

/** 항목이 없다는 안내와 대시보드로 돌아가는 링크. */
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
