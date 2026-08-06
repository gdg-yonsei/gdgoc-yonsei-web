import { Suspense } from 'react'
import GDGLogoLinkButton from '@/app/components/header/gdg-logo-link-button'
import MenuBarButton from './menu-bar-button'
import DesktopNavigationList, {
  DesktopNavigationListFallback,
} from '@/app/components/header/desktop-navigation-list'
import NavigationList from '@/app/components/header/navigation-list'
import type { Locale } from '@/i18n-config'

export default function Header({ lang }: { lang: Locale }) {
  return (
    <header className="fixed top-0 left-0 z-10 w-full border-b border-neutral-200/80 bg-neutral-100/95 shadow-sm backdrop-blur-md">
      <div className={'flex items-center justify-between p-4'}>
        <GDGLogoLinkButton lang={lang} />
        <MenuBarButton lang={lang} />
        {/* 두 내비게이션 모두 `usePathname`으로 활성 링크를 표시하므로 동적 세그먼트
            라우트의 프리렌더 셸에서 suspend 됩니다. 모바일 메뉴는 기본이 닫힘 상태라
            fallback이 필요 없지만, 데스크톱 메뉴는 링크가 셸에 남아 있어야 합니다. */}
        <Suspense fallback={<DesktopNavigationListFallback lang={lang} />}>
          <DesktopNavigationList lang={lang} />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <NavigationList lang={lang} />
      </Suspense>
    </header>
  )
}
