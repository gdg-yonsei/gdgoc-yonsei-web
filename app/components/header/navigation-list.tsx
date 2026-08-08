'use client'

import Link from 'next/link'
import { useAtom } from 'jotai'
import { homeMenuBarState } from '@/lib/atoms'
import { ReactNode } from 'react'
import { Locale } from '@/i18n-config'
import { usePathname } from 'next/navigation'

function MobileLink({
  children,
  href,
  isCurrent,
  onSelect,
}: {
  children: ReactNode
  href: string
  isCurrent: boolean
  onSelect: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      aria-current={isCurrent ? 'page' : undefined}
      className={`pressable focus-ring flex min-h-12 w-full items-center rounded-xl px-4 ${
        isCurrent ? 'bg-neutral-200 font-semibold' : 'hover:bg-neutral-200/70'
      }`}
    >
      {children}
    </Link>
  )
}

export default function NavigationList({ lang }: { lang: Locale }) {
  const [isMenuOpen, setIsMenuOpen] = useAtom(homeMenuBarState)
  const pathname = usePathname()

  if (!isMenuOpen) {
    return null
  }

  const links = [
    { href: `/${lang}/session`, label: lang === 'ko' ? '세션' : 'Sessions' },
    {
      href: `/${lang}/project`,
      label: lang === 'ko' ? '프로젝트' : 'Projects',
    },
    {
      href: `/${lang}/calendar`,
      label: lang === 'ko' ? '캘린더' : 'Calendar',
    },
    { href: `/${lang}/member`, label: lang === 'ko' ? '구성원' : 'Members' },
    { href: `/${lang}/admin`, label: 'GYMS' },
  ]

  return (
    <nav
      id="mobile-primary-navigation"
      aria-label={
        lang === 'ko' ? '모바일 주 메뉴' : 'Mobile primary navigation'
      }
      className="mobile-navigation w-full border-t border-neutral-200 p-2 text-lg md:hidden"
    >
      <div className="grid gap-1">
        {links.map(({ href, label }) => (
          <MobileLink
            key={href}
            href={href}
            isCurrent={pathname === href || pathname.startsWith(`${href}/`)}
            onSelect={() => setIsMenuOpen(false)}
          >
            {label}
          </MobileLink>
        ))}
      </div>
    </nav>
  )
}
