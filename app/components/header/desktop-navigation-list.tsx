'use client'

import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import { usePathname } from 'next/navigation'

function isCurrentPath(pathname: string | null, href: string) {
  if (!pathname) {
    return false
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function DesktopNavigation({
  lang,
  pathname,
}: {
  lang: Locale
  pathname: string | null
}) {
  const links = [
    { href: `/${lang}/admin`, label: 'GYMS' },
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
  ]

  return (
    <nav
      aria-label={lang === 'ko' ? '주 메뉴' : 'Primary navigation'}
      className="flex items-center gap-1 text-base not-md:hidden lg:text-lg"
    >
      {links.map(({ href, label }) => {
        const isCurrent = isCurrentPath(pathname, href)

        return (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent ? 'page' : undefined}
            className={`navigation-link pressable focus-ring ${
              isCurrent ? 'bg-neutral-200 font-semibold text-neutral-950' : ''
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * `usePathname`은 `generateStaticParams`로 알 수 없는 동적 세그먼트 라우트의 프리렌더
 * 중에는 값을 확정할 수 없어 suspend 됩니다. 정적 셸에도 탐색 링크가 HTML로 남아
 * 크롤러가 따라갈 수 있도록, 활성 표시만 제외한 동일한 메뉴를 fallback으로 제공합니다.
 */
export function DesktopNavigationListFallback({ lang }: { lang: Locale }) {
  return <DesktopNavigation lang={lang} pathname={null} />
}

export default function DesktopNavigationList({ lang }: { lang: Locale }) {
  return <DesktopNavigation lang={lang} pathname={usePathname()} />
}
