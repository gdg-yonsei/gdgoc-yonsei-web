import Link from 'next/link'
import { ReactNode } from 'react'

/**
 * 관리자 페이지 상단 네비게이션 버튼
 * @param href
 * @param children
 * @constructor
 */
export default function AdminNavigationButton({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={'flex gap-1 items-center hover:underline py-1'}
    >
      {children}
    </Link>
  )
}
