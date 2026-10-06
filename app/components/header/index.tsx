/** 경로를 읽는 클라이언트 내비게이션은 Suspense로 감싸, 경로와 무관한 정적 헤더를 미리 렌더링한다. */
import { Suspense } from 'react'
import Link from 'next/link'
import GDGLogo from '@/app/components/svg/gdg-logo'
import type { Locale } from '@/lib/i18n'
import { chromeCopy } from '@/lib/contents/site-copy'
import HeaderNavigation, { NavigationFallback } from './navigation'
import {
  getHeaderNavigationCopy,
  getHeaderNavigationLinks,
} from './navigation-links'
import { localeHref } from '@/lib/site/routes'

export default function Header({ lang }: { lang: Locale }) {
  const links = getHeaderNavigationLinks(lang)
  const copy = getHeaderNavigationCopy(lang)

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link
          href={localeHref(lang)}
          aria-label={chromeCopy[lang].home}
          className="site-header-logo pressable"
        >
          <GDGLogo
            svgKey="header"
            aria-hidden="true"
            className="h-[22px] w-auto"
          />
          <span className="font-display text-[15px] font-semibold tracking-tight [font-variation-settings:'ROND'_100] max-[359px]:sr-only">
            GDGoC Yonsei
          </span>
        </Link>
        <Suspense
          fallback={
            <NavigationFallback lang={lang} links={links} copy={copy} />
          }
        >
          <HeaderNavigation lang={lang} links={links} copy={copy} />
        </Suspense>
      </div>
    </header>
  )
}
