import { Suspense } from 'react'
import GDGLogoLinkButton from '@/app/components/header/gdg-logo-link-button'
import MenuBarButton from './menu-bar-button'
import DesktopNavigationList, {
  DesktopNavigationListFallback,
} from '@/app/components/header/desktop-navigation-list'
import NavigationList from '@/app/components/header/navigation-list'
import type { Locale } from '@/i18n-config'

/**
 * `Header` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
