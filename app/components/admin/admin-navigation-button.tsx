import Link from 'next/link'
import { ReactNode } from 'react'
import { getAdminLocale, localizeAdminHref } from '@/lib/admin-i18n/server'

/**
 * 관리자 페이지 상단 네비게이션 버튼
 * @param href
 * @param children
 * @constructor
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
