import { Suspense } from 'react'
import Link from 'next/link'
import GDGLogo from '@/app/components/svg/gdg-logo'
import type { Locale } from '@/i18n-config'
import { chromeCopy } from '@/lib/contents/site-copy'
import HeaderNavigation, { NavigationFallback } from './navigation'
import {
  getHeaderNavigationCopy,
  getHeaderNavigationLinks,
} from './navigation-links'

/** Floating GDG-black capsule; legible over the dark stage and paper alike. */
export default function Header({ lang }: { lang: Locale }) {
  const links = getHeaderNavigationLinks(lang)
  const copy = getHeaderNavigationCopy(lang)

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link
          href={`/${lang}`}
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
