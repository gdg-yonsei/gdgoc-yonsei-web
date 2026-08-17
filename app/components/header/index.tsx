import { Suspense } from 'react'
import { Bars2Icon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import GDGLogo from '@/app/components/svg/gdg-logo'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import type { Locale } from '@/i18n-config'
import HeaderNavigation from './navigation'
import { getHeaderNavigationLinks } from './navigation-links'

function LogoLink({ lang }: { lang: Locale }) {
  return (
    <Link
      href={`/${lang}`}
      aria-label={lang === 'ko' ? 'GDGoC Yonsei 홈' : 'GDGoC Yonsei home'}
      className="pressable focus-ring rounded-xl"
    >
      <GDGoCYonseiLogo className="not-md:hidden" />
      <GDGLogo className="w-16 md:hidden md:w-24" svgKey="header" />
    </Link>
  )
}

function NavigationFallback({ lang }: { lang: Locale }) {
  return (
    <>
      <button
        type="button"
        disabled
        className="flex size-12 items-center justify-center rounded-full md:hidden"
        aria-label={lang === 'ko' ? '탐색 메뉴 로딩 중' : 'Loading navigation'}
      >
        <Bars2Icon className="size-8 text-neutral-950" aria-hidden="true" />
      </button>
      <nav
        aria-label={lang === 'ko' ? '주 메뉴' : 'Primary navigation'}
        className="flex items-center gap-1 text-base not-md:hidden lg:text-lg"
      >
        {getHeaderNavigationLinks(lang).map(({ href, label, prefetch }) => (
          <Link
            key={href}
            href={href}
            prefetch={prefetch}
            className="navigation-link pressable focus-ring"
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}

export default function Header({ lang }: { lang: Locale }) {
  return (
    <header className="fixed top-0 left-0 z-10 w-full border-b border-neutral-200/80 bg-neutral-100/95 shadow-sm backdrop-blur-md">
      <div className="relative flex items-center justify-between p-4">
        <LogoLink lang={lang} />
        <Suspense fallback={<NavigationFallback lang={lang} />}>
          <HeaderNavigation lang={lang} />
        </Suspense>
      </div>
    </header>
  )
}
