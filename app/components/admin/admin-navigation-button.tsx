/**
 * 관리자 페이지 상단의 이동 버튼(서버 컴포넌트). 현재 관리자 언어를 링크에 붙여 준다.
 */
import Link from 'next/link'
import { ReactNode } from 'react'
import { getAdminLocale, localizeAdminHref } from '@/lib/admin-i18n/server'

/**
 * 언어가 반영된 관리자 링크 버튼.
 *
 * @param href 언어 접두사가 없는 관리자 경로(예: `/admin/sessions`)
 * @param children 버튼 내용
 */
export default async function AdminNavigationButton({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  const locale = await getAdminLocale()

  return (
    <Link
      href={localizeAdminHref(href, locale)}
      className={'flex items-center gap-1 py-1 hover:underline'}
    >
      {children}
    </Link>
  )
}
