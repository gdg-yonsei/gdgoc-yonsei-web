import Link from 'next/link'
import { ReactNode } from 'react'
import { getAdminLocale, localizeAdminHref } from '@/lib/admin-i18n/server'

/** href는 언어 접두사 없는 관리자 경로이며, 현재 관리자 언어를 붙여 연결한다. */
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
      className={'flex min-h-11 items-center gap-1 py-1 hover:underline'}
    >
      {children}
    </Link>
  )
}
