import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { ReactNode } from 'react'

export default function NavigationButton({
  children,
  href,
}: {
  children: ReactNode
  href: string
}) {
  return (
    <div className={'mx-auto w-full max-w-4xl py-4'}>
      <Link href={href} className={'flex items-center gap-2 hover:underline'}>
        <ChevronLeftIcon className={'size-6'} />
        {children}
      </Link>
    </div>
  )
}
