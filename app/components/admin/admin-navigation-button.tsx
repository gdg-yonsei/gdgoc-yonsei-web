import Link from 'next/link'
import { ReactNode } from 'react'

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
