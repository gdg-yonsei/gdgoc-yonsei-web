/**
 * 공개 사이트 상단 헤더(서버 컴포넌트).
 *
 * 링크와 문구를 서버에서 골라 클라이언트 내비게이션에 props로 넘긴다. 현재 경로를 읽는
 * 클라이언트 부분은 Suspense로 감싸, 정적 셸이 경로와 무관하게 미리 렌더링되게 한다.
 */
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

/** 떠 있는 검은 캡슐 모양 헤더. 어두운 무대 배경과 밝은 종이 배경 모두에서 읽히도록 디자인했다. */
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
